window.addEventListener("load",cargarLista);

function $(id) {
    return document.getElementById(id);
}

function cargarLista() 
{
    var peticionHttp = new XMLHttpRequest();
    peticionHttp.onreadystatechange = function() { 
        
        if(peticionHttp.readyState==4 && peticionHttp.status==200)
        {
            var listaMaterias = JSON.parse(peticionHttp.responseText);
            for(var i=0;i<listaMaterias.length;i++) 
            {
                agregarFila(listaMaterias[i]);
            }            
        }
    }
    peticionHttp.open("GET", "http://localhost:3000/materias", true);
    peticionHttp.send();
}

function agregarFila(materia) 
{
    var tcuerpo = $("tcuerpo");
    var row = document.createElement("tr");
    tcuerpo.appendChild(row);

    var tdNombre = document.createElement("td");
    row.appendChild(tdNombre);
    var textoNombre = document.createTextNode(materia.nombre);
    tdNombre.appendChild(textoNombre);

    var tdCuatri = document.createElement("td");
    row.appendChild(tdCuatri);
    var textoCuatri = document.createTextNode(materia.cuatrimestre);
    tdCuatri.appendChild(textoCuatri);

    var tdFecha = document.createElement("td");
    row.appendChild(tdFecha);
    var textoFecha = document.createTextNode(materia.fechaFinal);
    tdFecha.appendChild(textoFecha);    
    
    var tdTurno = document.createElement("td");
    row.appendChild(tdTurno);
    var textoTurno = document.createTextNode(materia.turno);
    tdTurno.appendChild(textoTurno);

    var tdId = document.createElement("td");
    row.appendChild(tdId);
    var textoId = document.createTextNode(materia.id);
    tdId.appendChild(textoId);
    tdId.style="display:none";

    row.addEventListener("dblclick",editarFila);
}

function editarFila(event) 
{
    var divEdit = $("divEditar");
    divEdit.hidden = false;

    var elemento = event.target;
    var fila = elemento.parentNode;
    var datos = fila.childNodes;
    var nombre = datos[0].childNodes[0].nodeValue;
    var cuatrimestre = datos[1].childNodes[0].nodeValue;
    var fechaFinal = datos[2].childNodes[0].nodeValue;
    var turno = datos[3].childNodes[0].nodeValue;
    var id = datos[4].childNodes[0].nodeValue;

    $("inputNombre").value = nombre;
    $("selCuatri").value = cuatrimestre;
    $("selCuatri").disabled = true;

    //convertir este formato 24/11/2019 a este 2019-11-24
    var res = fechaFinal.split("/");
    fechaFinal = (res[2]+"-"+res[1]+"-"+res[0]);
    $("inputFecha").value = fechaFinal;

    if(turno == "Mañana") {
        $("inputManana").checked = true;
    }
    else {
        $("inputNoche").checked = true;
    }
    
    $("inputModif").onclick=function() {
        var nuevoNombre = $("inputNombre").value;
        var nuevaFechaFinal = $("inputFecha").value;
        
        if($("inputManana").checked) {
            var nuevoTurno = "Mañana";
        }
        else {
            var nuevoTurno = "Noche";
        }
        
        var jsonMateria = {"nombre":nuevoNombre,"cuatrimestre":cuatrimestre,"fechaFinal":nuevaFechaFinal,"turno":nuevoTurno,"id":id};
        if(validarIngreso(jsonMateria)) {
            
            //revertir a este formato 24/11/2019
            var res = nuevaFechaFinal.split("-");
            nuevaFechaFinal = (res[2]+"/"+res[1]+"/"+res[0]);
            jsonMateria["fechaFinal"] = nuevaFechaFinal;

            //ENVIO DE DATOS POR METODO POST
            var peticionHttp = new XMLHttpRequest();
            peticionHttp.open("POST","http://localhost:3000/editar",true);
            peticionHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            peticionHttp.send(JSON.stringify(jsonMateria));
            
            $("divSpinner").hidden = false;
            $("divDimmer").hidden = false;
            
            peticionHttp.onreadystatechange = function() {
                if(peticionHttp.readyState==4 && peticionHttp.status==200) 
                {
                    respuesta = JSON.parse(peticionHttp.responseText);
                    if(respuesta.type == "ok") {
                        datos[0].childNodes[0].nodeValue = nuevoNombre;
                        datos[1].childNodes[0].nodeValue = cuatrimestre;
                        datos[2].childNodes[0].nodeValue = nuevaFechaFinal;
                        datos[3].childNodes[0].nodeValue = nuevoTurno;
                        datos[4].childNodes[0].nodeValue = id;
                    }
                    else {
                        alert("Error de servidor, no se pudieron modificar los datos.");
                    }
                    $("divSpinner").hidden = true;
                    $("divDimmer").hidden = true;

                    divEdit.hidden = true;
                }
            }
        }
    }
    
    $("inputElim").onclick=function() {
        var jsonMateria = {"id":id};

        //ENVIO DE DATOS POR METODO POST
        var peticionHttp=new XMLHttpRequest();
        peticionHttp.open("POST","http://localhost:3000/eliminar");
        peticionHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        peticionHttp.send(JSON.stringify(jsonMateria));
        $("divSpinner").hidden = false;
        $("divDimmer").hidden = false;

        peticionHttp.onreadystatechange= function() 
        {                
            if(peticionHttp.status == 200 && peticionHttp.readyState == 4)
            {
                respuesta = JSON.parse(peticionHttp.responseText);
                if(respuesta.type == "ok") {
                    fila.parentNode.removeChild(fila);
                }
                $("divSpinner").hidden = true;
                $("divDimmer").hidden = true;

                divEdit.hidden = true;
            }
        }
    }

    $("inputCerrar").onclick=function() {
        divEdit.hidden = true;
    }

}

function validarIngreso (jsonMateria) {
    var error = false;

    if(jsonMateria.nombre.length > 6) {
        $("inputNombre").className = "sinError";
    }
    else {
        $("inputNombre").className = "conError";
        error = true;
    }

    var fecha = new Date(jsonMateria.fechaFinal);
    fecha.setMinutes(fecha.getMinutes()+fecha.getTimezoneOffset()); //corrijo el offset ya que el input la trae en UTC+0.
    var fechaActual = new Date();
    fechaActual.setHours(0,0,0,0); //seteo en cero ya que sólo valida el día y no la hora.
    if(fecha > fechaActual) {
        $("inputFecha").className = "sinError";
    }
    else {
        $("inputFecha").className = "conError";
        error = true;
    }

    if(jsonMateria.turno == "Mañana" || jsonMateria.turno == "Noche") {
        $("inputManana").className = "sinError";
        $("inputNoche").className = "sinError";
    }
    else {
        $("inputManana").className = "conError";
        $("inputNoche").className = "conError";
        error = true;
    }

    if(!$("selCuatri").disabled) {
        error = true;
    }

    return !error;
}