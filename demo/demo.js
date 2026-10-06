/* =========================================================
   Demo POS · Transporte y Encomiendas
   Datos ficticios. La semilla vive en data/seed.json y todo
   cambio se persiste en localStorage bajo la clave STORAGE_KEY.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'posdemo:data';
  // La sesión vive en sessionStorage: sobrevive a un F5 (recargar no debería
  // expulsar a nadie) pero no a una visita nueva, así que quien llega por
  // primera vez siempre ve la pantalla de login.
  var SESION_KEY = 'posdemo:sesion';

  var datos = null;
  var paginaActual = 'dashboard';
  var filtro = '';

  var $ = function (sel) { return document.querySelector(sel); };

  var formatoMoneda = new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', minimumFractionDigits: 2
  });

  function soles(n) { return formatoMoneda.format(n || 0); }

  function escapar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fechaCorta(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  /* ---------------- Persistencia ---------------- */

  function cargar() {
    var guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { guardado = null; }

    if (guardado && Array.isArray(guardado.productos)) {
      datos = guardado;
      return Promise.resolve();
    }

    return fetch('data/seed.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo cargar data/seed.json (' + r.status + ')');
        return r.json();
      })
      .then(function (semilla) {
        delete semilla._nota;
        datos = semilla;
        guardar();
      });
  }

  function guardar() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(datos)); } catch (e) { /* modo privado */ }
  }

  function restablecer() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
    return cargar().then(function () {
      renderTodo();
      toast('Datos de la demo restablecidos');
    });
  }

  /* ---------------- Navegación ---------------- */

  function irA(pagina) {
    paginaActual = pagina;

    document.querySelectorAll('.nav-item[data-page]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-page') === pagina);
    });

    $('#pagina-dashboard').hidden = pagina !== 'dashboard';
    $('#pagina-productos').hidden = pagina !== 'productos';
    $('#titulo-pagina').textContent = pagina === 'dashboard' ? 'Estadísticas' : 'Productos';
    $('#sidebar').classList.remove('is-open');
  }

  /* ---------------- Dashboard ---------------- */

  function ventasDeHoy() {
    if (!datos.ventas.length) return { fecha: null, total: 0, cantidad: 0 };
    var fechas = datos.ventas.map(function (v) { return v.fecha; }).sort();
    var ultima = fechas[fechas.length - 1];
    var delDia = datos.ventas.filter(function (v) { return v.fecha === ultima && v.estado !== 'Anulada'; });
    return {
      fecha: ultima,
      total: delDia.reduce(function (a, v) { return a + v.total; }, 0),
      cantidad: delDia.length
    };
  }

  function productosStockBajo() {
    return datos.productos.filter(function (p) { return p.stock <= p.stockMinimo; })
      .sort(function (a, b) { return a.stock - b.stock; });
  }

  function renderKPIs() {
    var hoy = ventasDeHoy();
    var bajo = productosStockBajo();
    var enTransito = datos.encomiendas.filter(function (e) { return e.estado === 'En tránsito'; });

    var iconos = {
      ventas: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      caja: '<path d="M21 8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M1 4h22v4H1z"/><path d="M10 12h4"/>',
      alerta: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
      camion: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>'
    };

    function kpi(icono, clase, label, valor, pie) {
      return '<div class="kpi">' +
        '<div class="kpi-icon ' + clase + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icono + '</svg></div>' +
        '<div><div class="kpi-label">' + escapar(label) + '</div>' +
        '<div class="kpi-value">' + escapar(valor) + '</div>' +
        '<div class="kpi-label">' + escapar(pie) + '</div></div></div>';
    }

    $('#kpis').innerHTML =
      kpi(iconos.ventas, '', 'Ventas del día', soles(hoy.total), hoy.cantidad + ' comprobantes') +
      kpi(iconos.caja, '', 'Productos activos', String(datos.productos.length), 'en catálogo') +
      kpi(iconos.alerta, bajo.length ? 'is-warn' : 'is-ok', 'Stock bajo', String(bajo.length), 'requieren reposición') +
      kpi(iconos.camion, '', 'Encomiendas', String(enTransito.length), 'en tránsito');
  }

  function renderGrafico() {
    var serie = datos.ventasSemana || [];
    if (!serie.length) { $('#grafico').innerHTML = '<p class="muted">Sin datos.</p>'; return; }

    var W = 640, H = 260;
    var pad = { top: 24, right: 12, bottom: 34, left: 12 };
    var ancho = W - pad.left - pad.right;
    var alto = H - pad.top - pad.bottom;
    var max = Math.max.apply(null, serie.map(function (d) { return d.monto; })) || 1;
    var paso = ancho / serie.length;
    var anchoBarra = Math.min(46, paso * 0.55);

    var partes = [];
    partes.push('<line class="axis" x1="' + pad.left + '" y1="' + (pad.top + alto) + '" x2="' + (W - pad.right) + '" y2="' + (pad.top + alto) + '"/>');

    serie.forEach(function (d, i) {
      var h = Math.max(2, Math.round((d.monto / max) * alto));
      var x = pad.left + paso * i + (paso - anchoBarra) / 2;
      var y = pad.top + alto - h;
      var cx = x + anchoBarra / 2;

      partes.push('<rect class="bar" x="' + x.toFixed(1) + '" y="' + y + '" width="' + anchoBarra.toFixed(1) +
        '" height="' + h + '" rx="3"><title>' + escapar(d.dia + ': ' + soles(d.monto)) + '</title></rect>');
      partes.push('<text class="bar-value" x="' + cx.toFixed(1) + '" y="' + (y - 6) + '" text-anchor="middle">' +
        escapar(Math.round(d.monto)) + '</text>');
      partes.push('<text class="bar-label" x="' + cx.toFixed(1) + '" y="' + (pad.top + alto + 20) +
        '" text-anchor="middle">' + escapar(d.dia) + '</text>');
    });

    $('#grafico').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
      'aria-label="Ventas de la semana en soles">' + partes.join('') + '</svg>';
  }

  function renderStockBajo() {
    var bajo = productosStockBajo();
    if (!bajo.length) {
      $('#lista-stock-bajo').innerHTML = '<li class="vacío">Todo el inventario está por encima del mínimo.</li>';
      return;
    }
    $('#lista-stock-bajo').innerHTML = bajo.map(function (p) {
      return '<li><span class="nombre">' + escapar(p.nombre) +
        '<br><span class="codigo">' + escapar(p.codigo) + '</span></span>' +
        '<span class="tag tag-danger">' + p.stock + ' / mín. ' + p.stockMinimo + '</span></li>';
    }).join('');
  }

  function claseEstado(estado) {
    if (estado === 'Emitida' || estado === 'Entregado') return 'tag-ok';
    if (estado === 'Anulada') return 'tag-danger';
    if (estado === 'Pendiente' || estado === 'En tránsito') return 'tag-warn';
    return '';
  }

  function renderVentas() {
    var filas = datos.ventas.slice().sort(function (a, b) {
      return (b.fecha + b.hora).localeCompare(a.fecha + a.hora);
    }).slice(0, 6);

    if (!filas.length) {
      $('#tabla-ventas').innerHTML = '<tr><td class="vacio" colspan="5">Sin ventas registradas.</td></tr>';
      return;
    }

    $('#tabla-ventas').innerHTML = filas.map(function (v) {
      return '<tr>' +
        '<td class="codigo">' + escapar(v.comprobante) + '</td>' +
        '<td>' + escapar(v.cliente) + '</td>' +
        '<td>' + fechaCorta(v.fecha) + ' · ' + escapar(v.hora) + '</td>' +
        '<td class="num">' + soles(v.total) + '</td>' +
        '<td><span class="tag ' + claseEstado(v.estado) + '">' + escapar(v.estado) + '</span></td>' +
        '</tr>';
    }).join('');
  }

  /* ---------------- Productos ---------------- */

  function productosFiltrados() {
    var q = filtro.trim().toLowerCase();
    var lista = datos.productos.slice().sort(function (a, b) {
      return a.nombre.localeCompare(b.nombre, 'es');
    });
    if (!q) return lista;
    return lista.filter(function (p) {
      return p.nombre.toLowerCase().indexOf(q) !== -1 || p.codigo.toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderProductos() {
    var lista = productosFiltrados();

    if (!lista.length) {
      $('#tabla-productos').innerHTML = '<tr><td class="vacio" colspan="6">' +
        (filtro ? 'Ningún producto coincide con la búsqueda.' : 'No hay productos.') + '</td></tr>';
    } else {
      $('#tabla-productos').innerHTML = lista.map(function (p) {
        var bajo = p.stock <= p.stockMinimo;
        return '<tr>' +
          '<td class="codigo">' + escapar(p.codigo) + '</td>' +
          '<td>' + escapar(p.nombre) + '</td>' +
          '<td><span class="tag">' + escapar(p.categoria) + '</span></td>' +
          '<td class="num">' + soles(p.precio) + '</td>' +
          '<td class="num"><span class="' + (bajo ? 'stock' : '') + '">' + p.stock + '</span></td>' +
          '<td class="num"><div class="acciones">' +
            '<button class="icon-btn" data-editar="' + p.id + '" title="Editar" aria-label="Editar ' + escapar(p.nombre) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>' +
            '</button>' +
            '<button class="icon-btn" data-eliminar="' + p.id + '" title="Eliminar" aria-label="Eliminar ' + escapar(p.nombre) + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>' +
            '</button>' +
          '</div></td>' +
          '</tr>';
      }).join('');
    }

    $('#contador-productos').textContent = lista.length + ' de ' + datos.productos.length + ' productos';
  }

  /* ---------------- Modal ---------------- */

  var modal = null;

  function abrirModal(producto) {
    $('#modal-titulo').textContent = producto ? 'Editar producto' : 'Nuevo producto';
    $('#p-id').value = producto ? producto.id : '';
    $('#p-codigo').value = producto ? producto.codigo : '';
    $('#p-nombre').value = producto ? producto.nombre : '';
    $('#p-categoria').value = producto ? producto.categoria : datos.categorias[0];
    $('#p-precio').value = producto ? producto.precio : '';
    $('#p-stock').value = producto ? producto.stock : '';
    $('#p-stockMinimo').value = producto ? producto.stockMinimo : '';
    $('#form-error').hidden = true;
    modal.hidden = false;
    $('#p-codigo').focus();
  }

  function cerrarModal() { modal.hidden = true; }

  function guardarProducto(e) {
    e.preventDefault();

    var id = $('#p-id').value;
    var codigo = $('#p-codigo').value.trim().toUpperCase();
    var nombre = $('#p-nombre').value.trim();
    var precio = parseFloat($('#p-precio').value);
    var stock = parseInt($('#p-stock').value, 10);
    var stockMinimo = parseInt($('#p-stockMinimo').value, 10);
    var error = $('#form-error');

    var duplicado = datos.productos.some(function (p) {
      return p.codigo === codigo && String(p.id) !== String(id);
    });
    if (duplicado) {
      error.textContent = 'Ya existe un producto con el código ' + codigo + '.';
      error.hidden = false;
      return;
    }

    if (!(precio >= 0) || !(stock >= 0) || !(stockMinimo >= 0)) {
      error.textContent = 'Precio y stock deben ser números mayores o iguales a cero.';
      error.hidden = false;
      return;
    }

    var registro = {
      codigo: codigo,
      nombre: nombre,
      categoria: $('#p-categoria').value,
      precio: precio,
      stock: stock,
      stockMinimo: stockMinimo
    };

    if (id) {
      var i = datos.productos.findIndex(function (p) { return String(p.id) === String(id); });
      if (i !== -1) datos.productos[i] = Object.assign({}, datos.productos[i], registro);
      toast('Producto actualizado');
    } else {
      var nuevoId = datos.productos.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1;
      registro.id = nuevoId;
      datos.productos.push(registro);
      toast('Producto creado');
    }

    guardar();
    cerrarModal();
    renderTodo();
  }

  function eliminarProducto(id) {
    var p = datos.productos.find(function (x) { return String(x.id) === String(id); });
    if (!p) return;
    if (!confirm('¿Eliminar "' + p.nombre + '"? Esta acción solo afecta los datos de la demo.')) return;

    datos.productos = datos.productos.filter(function (x) { return String(x.id) !== String(id); });
    guardar();
    renderTodo();
    toast('Producto eliminado');
  }

  /* ---------------- Toast ---------------- */

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  /* ---------------- Render global ---------------- */

  function renderTodo() {
    renderKPIs();
    renderGrafico();
    renderStockBajo();
    renderVentas();
    renderProductos();
  }

  /* ---------------- Arranque ---------------- */

  function iniciarSesion() {
    try { sessionStorage.setItem(SESION_KEY, '1'); } catch (e) { /* modo privado */ }
    $('#vista-login').hidden = true;
    $('#vista-app').hidden = false;
    irA('dashboard');
  }

  function cerrarSesion() {
    try { sessionStorage.removeItem(SESION_KEY); } catch (e) { /* noop */ }
    $('#vista-app').hidden = true;
    $('#vista-login').hidden = false;
    $('#sidebar').classList.remove('is-open');
  }

  function sesionActiva() {
    try { return sessionStorage.getItem(SESION_KEY) === '1'; } catch (e) { return false; }
  }

  function conectar() {
    $('#form-login').addEventListener('submit', function (e) {
      e.preventDefault();
      iniciarSesion();
    });

    document.querySelectorAll('.nav-item[data-page]').forEach(function (b) {
      b.addEventListener('click', function () { irA(b.getAttribute('data-page')); });
    });

    $('#btn-menu').addEventListener('click', function () {
      $('#sidebar').classList.toggle('is-open');
    });

    $('#btn-salir').addEventListener('click', cerrarSesion);

    $('#btn-reset').addEventListener('click', function () {
      if (confirm('¿Restablecer los datos de la demo a su estado inicial?')) restablecer();
    });

    $('#btn-nuevo').addEventListener('click', function () { abrirModal(null); });

    $('#buscar').addEventListener('input', function (e) {
      filtro = e.target.value;
      renderProductos();
    });

    $('#form-producto').addEventListener('submit', guardarProducto);

    document.querySelectorAll('[data-cerrar]').forEach(function (el) {
      el.addEventListener('click', cerrarModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) cerrarModal();
    });

    $('#tabla-productos').addEventListener('click', function (e) {
      var editar = e.target.closest('[data-editar]');
      if (editar) {
        var id = editar.getAttribute('data-editar');
        abrirModal(datos.productos.find(function (p) { return String(p.id) === id; }));
        return;
      }
      var eliminar = e.target.closest('[data-eliminar]');
      if (eliminar) eliminarProducto(eliminar.getAttribute('data-eliminar'));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    modal = $('#modal-producto');

    var select = $('#p-categoria');

    cargar()
      .then(function () {
        select.innerHTML = datos.categorias.map(function (c) {
          return '<option value="' + escapar(c) + '">' + escapar(c) + '</option>';
        }).join('');
        conectar();
        renderTodo();
        if (sesionActiva()) iniciarSesion();
      })
      .catch(function (err) {
        $('#vista-login').hidden = true;
        $('#vista-app').hidden = false;
        $('#titulo-pagina').textContent = 'Error';
        $('.content').innerHTML = '<div class="card"><div class="card-body">' +
          '<p><strong>No se pudieron cargar los datos de la demo.</strong></p>' +
          '<p class="muted">' + escapar(err.message) + '</p>' +
          '<p class="muted">Esta demo debe servirse por HTTP (no funciona abriendo el archivo directamente).</p>' +
          '</div></div>';
      });
  });
})();
