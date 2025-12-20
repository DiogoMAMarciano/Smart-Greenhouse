function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Estufa");
  var data = e.parameter.data;
  var modo = e.parameter.modo;
  
  // Receber dados do ESP32
  if(data) {
    var parts = data.split(";"); 
    var temp = parts[0].split(":")[1]; 
    var hum = parts[1].split(":")[1]; 
    var ventilador = parts[2] ? parts[2].split(":")[1] : 0; // Adicionar ventilador se existir
    sheet.appendRow([new Date(), temp, hum, ventilador]);
    return ContentService.createTextOutput("Dados adicionados");
  }
  
  // Modo gráfico - devolve página HTML
  if(modo == "grafico") {
    return HtmlService.createHtmlOutput(gerarGrafico(sheet));
  }
  
  // Modo todos - devolve todos os dados do dia
  if(modo == "todos") {
    return ContentService.createTextOutput(JSON.stringify(getTodosOsDados(sheet)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Modo normal - devolve última leitura (compatível com MIT App Inventor)
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    return ContentService.createTextOutput(JSON.stringify({erro: "Sem dados"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var dataHora = Utilities.formatDate(
    sheet.getRange(lastRow, 1).getValue(),
    "Europe/Lisbon",
    "dd/MM/yyyy HH:mm:ss"
  );
  var temperatura = sheet.getRange(lastRow, 2).getValue();
  var humidade = sheet.getRange(lastRow, 3).getValue();
  var ventilador = sheet.getRange(lastRow, 4).getValue() || 0;
  
  var resultado = {
    "Data": dataHora,
    "Temperatura": temperatura,
    "Humidade": humidade,
    "Ventilador": ventilador
  };
  
  return ContentService.createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

// Nova função para retornar todos os dados do dia atual
function getTodosOsDados(sheet) {
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  var lastRow = sheet.getLastRow();
  var dados = [];
  
  // Ler todas as linhas a partir da linha 2 (pulando o cabeçalho)
  for (var i = 2; i <= lastRow; i++) {
    var dataHora = sheet.getRange(i, 1).getValue();
    
    // Verificar se é do dia de hoje
    if (dataHora >= hoje) {
      var dataFormatada = Utilities.formatDate(
        dataHora,
        "Europe/Lisbon",
        "yyyy/MM/dd HH:mm:ss"
      );
      
      dados.push({
        "Data": dataFormatada,
        "Temperatura": sheet.getRange(i, 2).getValue(),
        "Humidade": sheet.getRange(i, 3).getValue(),
        "Ventilador": sheet.getRange(i, 4).getValue() || 0
      });
    }
  }
  
  return dados;
}

function gerarGrafico(sheet) {
  var lastRow = sheet.getLastRow();
  var numLinhas = Math.min(lastRow - 1, 20);
  
  var labels = [];
  var temps = [];
  var hums = [];
  
  for (var i = lastRow - numLinhas + 1; i <= lastRow; i++) {
    var dataHora = Utilities.formatDate(
      sheet.getRange(i, 1).getValue(),
      "Europe/Lisbon",
      "HH:mm"
    );
    labels.push(dataHora);
    temps.push(sheet.getRange(i, 2).getValue());
    hums.push(sheet.getRange(i, 3).getValue());
  }
  
  var html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        margin: 10px;
        background: #f5f5f5;
      }
      .container {
        background: white;
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      h3 { 
        margin: 0 0 10px 0;
        color: #333;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h3>🌡️ Temperatura (°C)</h3>
      <canvas id="tempChart"></canvas>
    </div>
    <div class="container">
      <h3>💧 Humidade (%)</h3>
      <canvas id="humChart"></canvas>
    </div>
    
    <script>
      var labels = ${JSON.stringify(labels)};
      var temps = ${JSON.stringify(temps)};
      var hums = ${JSON.stringify(hums)};
      
      new Chart(document.getElementById('tempChart'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Temperatura',
            data: temps,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: false }
          }
        }
      });
      
      new Chart(document.getElementById('humChart'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Humidade',
            data: hums,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: false }
          }
        }
      });
    </script>
  </body>
  </html>
  `;
  
  return html;
}
