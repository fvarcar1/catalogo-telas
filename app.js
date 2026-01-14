let telas = JSON.parse(localStorage.getItem("telas")) || [];
let modeloIA = null;

// ================================
// CARGAR MODELO IA REAL
// ================================
async function cargarIA() {
  modeloIA = await mobilenet.load();
}
cargarIA();

// ================================
// PROCESAR IMÁGENES
// ================================
function procesarImagenes() {
  const files = document.getElementById("fotos").files;
  if (!files.length) return alert("Selecciona imágenes");

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = async () => {

        const clasificacion = await modeloIA.classify(img);
        const patron = detectarPatronIA(clasificacion);
        const color = detectarColor(img);

        telas.push({
          codigo: "TEL-" + (telas.length + 1),
          imagen: reader.result,
          color,
          patron,
          corregido: false
        });

        guardar();
        filtrar();
      };
    };
    reader.readAsDataURL(file);
  });
}

// ================================
// IA – DETECTAR PATRÓN
// ================================
function detectarPatronIA(resultados) {
  const texto = resultados.map(r => r.className).join(" ");

  if (texto.includes("polka") || texto.includes("dot")) return "lunares";
  if (texto.includes("stripe")) return "rayas";
  if (texto.includes("floral") || texto.includes("flower")) return "flores";
  if (texto.includes("plaid") || texto.includes("check")) return "cuadros";

  return "liso";
}

// ================================
// COLOR DOMINANTE
// ================================
function detectarColor(img) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  c.width = img.width;
  c.height = img.height;
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0,0,c.width,c.height).data;
  let r=0,g=0,b=0,n=0;

  for (let i=0;i<data.length;i+=20) {
    r+=data[i]; g+=data[i+1]; b+=data[i+2]; n++;
  }
  r/=n; g/=n; b/=n;

  if (g>r && g>b) return "verde";
  if (r>g && r>b) return "rojo";
  if (b>r && b>g) return "azul";
  if (r>200 && g>200) return "amarillo";
  if (r>220 && g>220 && b>220) return "blanco";
  if (r<50 && g<50 && b<50) return "negro";
  return "otro";
}

// ================================
// FILTRAR
// ================================
function filtrar() {
  const fc = filtroColor.value;
  const fp = filtroPatron.value;

  const lista = telas.filter(t =>
    (!fc || t.color === fc) &&
    (!fp || t.patron === fp)
  );

  mostrar(lista);
}

// ================================
// MOSTRAR + CORRECCIÓN
// ================================
function mostrar(lista) {
  catalogo.innerHTML = "";

  lista.forEach((tela) => {
    const index = telas.indexOf(tela);

    catalogo.innerHTML += `
      <div class="tela ${tela.corregido ? "corregido" : ""}">
        <img src="${tela.imagen}">
        <b>${tela.codigo}</b>
        <p>${tela.color}</p>

        <select onchange="corregir(${index}, this.value)">
          ${op("liso", tela.patron)}
          ${op("lunares", tela.patron)}
          ${op("rayas", tela.patron)}
          ${op("flores", tela.patron)}
          ${op("cuadros", tela.patron)}
        </select>
      </div>
    `;
  });
}

function op(v, a) {
  return `<option ${v===a?"selected":""}>${v}</option>`;
}

// ================================
// CORREGIR MANUALMENTE
// ================================
function corregir(i, nuevo) {
  telas[i].patron = nuevo;
  telas[i].corregido = true;
  guardar();
}

// ================================
// GUARDAR
// ================================
function guardar() {
  localStorage.setItem("telas", JSON.stringify(telas));
}

// ================================
// PDF SOLO DEL FILTRO
// ================================
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  let y = 10;

  const fc = filtroColor.value;
  const fp = filtroPatron.value;

  telas.filter(t =>
    (!fc || t.color===fc) &&
    (!fp || t.patron===fp)
  ).forEach(t => {
    pdf.text(`${t.codigo} - ${t.color} - ${t.patron}`, 10, y);
    pdf.addImage(t.imagen, "JPEG", 10, y+5, 40, 40);
    y += 50;
    if (y > 260) { pdf.addPage(); y = 10; }
  });

  pdf.save("catalogo_filtrado.pdf");
}

filtrar();
