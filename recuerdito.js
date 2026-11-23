// 1. Referencias del DOM y estado
const inputTarea = document.getElementById("lista-tarea");
const inputFecha = document.getElementById("fecha-tarea");
const btnLimpiarFecha = document.getElementById("limpiar-fecha");
const botonGuardar = document.getElementById("guardar");
const listaTareas = document.getElementById("tareas-guardadas");
const inputBuscador = document.getElementById("buscador");

const btnAnadirVista = document.getElementById("btn-anadir-vista");
const btnBandeja = document.getElementById("btn-bandeja");
const btnHoy = document.getElementById("btn-hoy");
const btnCompletadas = document.getElementById("btn-completadas");
const tituloVista = document.querySelector("#div-3 h2");

let tareas = [];
let vistaActual = "bandeja";
let editandoId = null;

const CLAVE_TAREAS = "tareas_todoist";

// 2. Persistencia y utilidades de fecha
function guardarTareas() {
    localStorage.setItem(CLAVE_TAREAS, JSON.stringify(tareas));
}

function cargarTareas() {
    const datosGuardados = localStorage.getItem(CLAVE_TAREAS);
    return datosGuardados ? JSON.parse(datosGuardados) : [];
}

function obtenerFechaHoy() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function limpiarFecha() {
    if (inputFecha) {
        inputFecha.value = "";
    }
}

// 3. Filtros, vistas y renderizado
function obtenerTareasFiltradas() {
    const textoBusqueda = inputBuscador ? inputBuscador.value.trim().toLowerCase() : "";

    if (textoBusqueda !== "") {
        return tareas.filter((tarea) =>
            tarea.titulo.toLowerCase().includes(textoBusqueda)
        );
    }

    if (vistaActual === "completadas") {
        return tareas.filter((tarea) => tarea.completada);
    }

    if (vistaActual === "hoy") {
        const hoy = obtenerFechaHoy();
        return tareas.filter((tarea) => !tarea.completada && tarea.fecha && tarea.fecha <= hoy);
    }

    // "bandeja" muestra todas las pendientes (con o sin fecha)
    return tareas.filter((tarea) => !tarea.completada);
}

function actualizarBotonActivo(botonActivo) {
    const botonesVista = [btnBandeja, btnHoy, btnCompletadas];
    botonesVista.forEach((btn) => {
        if (btn) {
            btn.classList.remove("activo");
        }
    });

    if (botonActivo) {
        botonActivo.classList.add("activo");
    }
}

function cambiarVista(nuevaVista, textoTitulo, botonActivo) {
    vistaActual = nuevaVista;
    editandoId = null;
    if (tituloVista) {
        tituloVista.textContent = textoTitulo;
    }
    actualizarBotonActivo(botonActivo);
    renderizarTareas();
}

function renderizarTareas() {
    listaTareas.innerHTML = "";

    const tareasVisibles = obtenerTareasFiltradas();

    if (tareasVisibles.length === 0) {
        const vacio = document.createElement("li");
        vacio.className = "estado-vacio";
        vacio.textContent = "No se encontraron tareas.";
        listaTareas.appendChild(vacio);
        return;
    }

    tareasVisibles.forEach((tarea) => {
        const li = document.createElement("li");

        if (editandoId === tarea.id) {
            const formEdicion = document.createElement("div");
            formEdicion.className = "form-edicion";

            const inputEditTitulo = document.createElement("input");
            inputEditTitulo.type = "text";
            inputEditTitulo.className = "editar-input-texto";
            inputEditTitulo.value = tarea.titulo;

            const inputEditFecha = document.createElement("input");
            inputEditFecha.type = "date";
            inputEditFecha.className = "editar-input-fecha";
            inputEditFecha.value = tarea.fecha || "";

            const btnQuitarFechaEdit = document.createElement("button");
            btnQuitarFechaEdit.type = "button";
            btnQuitarFechaEdit.textContent = "Sin fecha";
            btnQuitarFechaEdit.addEventListener("click", () => {
                inputEditFecha.value = "";
            });

            const btnGuardarEdit = document.createElement("button");
            btnGuardarEdit.type = "button";
            btnGuardarEdit.className = "btn-guardar-edicion";
            btnGuardarEdit.textContent = "Guardar";
            btnGuardarEdit.addEventListener("click", () => {
                guardarEdicionTarea(tarea.id, inputEditTitulo.value, inputEditFecha.value);
            });

            const btnCancelarEdit = document.createElement("button");
            btnCancelarEdit.type = "button";
            btnCancelarEdit.textContent = "Cancelar";
            btnCancelarEdit.addEventListener("click", cancelarEdicion);

            inputEditTitulo.addEventListener("keydown", (evento) => {
                if (evento.key === "Enter") {
                    guardarEdicionTarea(tarea.id, inputEditTitulo.value, inputEditFecha.value);
                } else if (evento.key === "Escape") {
                    cancelarEdicion();
                }
            });

            formEdicion.appendChild(inputEditTitulo);
            formEdicion.appendChild(inputEditFecha);
            formEdicion.appendChild(btnQuitarFechaEdit);
            formEdicion.appendChild(btnGuardarEdit);
            formEdicion.appendChild(btnCancelarEdit);
            li.appendChild(formEdicion);
            listaTareas.appendChild(li);

            inputEditTitulo.focus();
            return;
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = tarea.completada;
        checkbox.addEventListener("change", () => alternarCompletada(tarea.id));

        const texto = document.createElement("span");
        texto.textContent = tarea.titulo;
        if (tarea.completada) {
            texto.style.textDecoration = "line-through";
            texto.style.opacity = "0.65";
        }

        const fechaSpan = document.createElement("small");
        fechaSpan.textContent = tarea.fecha ? tarea.fecha : "Sin fecha";

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => iniciarEdicionTarea(tarea.id));

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", () => eliminarTarea(tarea.id));

        li.appendChild(checkbox);
        li.appendChild(texto);
        li.appendChild(fechaSpan);
        li.appendChild(btnEditar);
        li.appendChild(btnEliminar);
        listaTareas.appendChild(li);
    });
}

// 4. Acciones CRUD
function agregarTarea() {
    const titulo = inputTarea.value.trim();

    if (titulo === "") {
        return;
    }

    const nuevaTarea = {
        id: Date.now(),
        titulo: titulo,
        fecha: inputFecha ? inputFecha.value : "",
        completada: false
    };

    tareas.push(nuevaTarea);
    guardarTareas();
    renderizarTareas();

    inputTarea.value = "";
    limpiarFecha();
    inputTarea.focus();
}

function alternarCompletada(id) {
    const tareaEncontrada = tareas.find((tarea) => tarea.id === id);
    if (!tareaEncontrada) {
        return;
    }

    tareaEncontrada.completada = !tareaEncontrada.completada;
    guardarTareas();
    renderizarTareas();
}

function iniciarEdicionTarea(id) {
    editandoId = id;
    renderizarTareas();
}

function cancelarEdicion() {
    editandoId = null;
    renderizarTareas();
}

function guardarEdicionTarea(id, nuevoTitulo, nuevaFecha) {
    const tareaEncontrada = tareas.find((tarea) => tarea.id === id);
    if (!tareaEncontrada) {
        return;
    }

    const tituloLimpio = nuevoTitulo.trim();
    if (tituloLimpio === "") {
        return;
    }

    tareaEncontrada.titulo = tituloLimpio;
    tareaEncontrada.fecha = nuevaFecha || "";
    editandoId = null;
    guardarTareas();
    renderizarTareas();
}

function eliminarTarea(id) {
    if (editandoId === id) {
        editandoId = null;
    }
    tareas = tareas.filter((tarea) => tarea.id !== id);
    guardarTareas();
    renderizarTareas();
}

// 5. Eventos e inicialización
if (botonGuardar) {
    botonGuardar.addEventListener("click", agregarTarea);
}

if (btnLimpiarFecha) {
    btnLimpiarFecha.addEventListener("click", limpiarFecha);
}

if (inputTarea) {
    inputTarea.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
            agregarTarea();
        }
    });
}

if (inputBuscador) {
    inputBuscador.addEventListener("input", renderizarTareas);
}

if (btnAnadirVista) {
    btnAnadirVista.addEventListener("click", () => {
        cambiarVista("bandeja", "Bandeja de entrada", btnBandeja);
        inputTarea.focus();
    });
}

if (btnBandeja) {
    btnBandeja.addEventListener("click", () => {
        cambiarVista("bandeja", "Bandeja de entrada", btnBandeja);
    });
}

if (btnHoy) {
    btnHoy.addEventListener("click", () => {
        cambiarVista("hoy", "Hoy", btnHoy);
    });
}

if (btnCompletadas) {
    btnCompletadas.addEventListener("click", () => {
        cambiarVista("completadas", "Completadas", btnCompletadas);
    });
}

tareas = cargarTareas();
actualizarBotonActivo(btnBandeja);
renderizarTareas();
