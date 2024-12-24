const table = document.querySelector("table");
const csvFileInput = document.getElementById("csvFileInput");
const chartTypeSelect = document.getElementById("chartType");
const createChartButton = document.querySelector("button");
const clearTableButton = document.getElementById("clearTableButton");
const saveButton = document.getElementById("saveButton");
const loadButton = document.getElementById("loadButton");
const canvas = document.getElementById("canvasData");

// Add field selection container
const fieldSelectionContainer = document.createElement("div");
fieldSelectionContainer.id = "fieldSelection";
fieldSelectionContainer.style.margin = "10px 0";
fieldSelectionContainer.innerHTML = "<h4>Chọn trường và màu hiển thị:</h4>";
canvas.parentNode.insertBefore(fieldSelectionContainer, canvas);

let currentChart = null;
let selectedFields = new Set();
let fieldColors = new Map();

// Default colors
const defaultColors = [
  { bg: "rgba(255, 99, 132, 0.5)", border: "rgba(255, 99, 132, 1)" },
  { bg: "rgba(54, 162, 235, 0.5)", border: "rgba(54, 162, 235, 1)" },
  { bg: "rgba(255, 206, 86, 0.5)", border: "rgba(255, 206, 86, 1)" },
  { bg: "rgba(75, 192, 192, 0.5)", border: "rgba(75, 192, 192, 1)" },
  { bg: "rgba(153, 102, 255, 0.5)", border: "rgba(153, 102, 255, 1)" },
];

// Function to convert hex to rgba
function hexToRGBA(hex, alpha = 1) {
  let r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Function to update field selection checkboxes with color pickers
function updateFieldSelections() {
  const datasets = getTableData().datasets;

  fieldSelectionContainer.innerHTML = "<h4>Chọn trường và màu hiển thị:</h4>";

  if (datasets.length > 0) {
    const fieldList = document.createElement("div");
    fieldList.style.display = "flex";
    fieldList.style.flexWrap = "wrap";
    fieldList.style.gap = "10px";

    // Initialize selectedFields if empty
    if (selectedFields.size === 0) {
      // Select all fields by default
      datasets.forEach((_, index) => selectedFields.add(index));
    } else {
      // Remove invalid selections
      selectedFields = new Set(
        Array.from(selectedFields).filter((index) => index < datasets.length)
      );
    }

    datasets.forEach((dataset, index) => {
      if (dataset && dataset[0]) {
        const fieldContainer = document.createElement("div");
        fieldContainer.style.display = "flex";
        fieldContainer.style.alignItems = "center";
        fieldContainer.style.padding = "5px";
        fieldContainer.style.border = "1px solid #ddd";
        fieldContainer.style.borderRadius = "4px";

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `field-${index}`;
        checkbox.checked = selectedFields.has(index);

        // Label
        const label = document.createElement("label");
        label.htmlFor = `field-${index}`;
        label.textContent = dataset[0];
        label.style.marginLeft = "5px";
        label.style.marginRight = "10px";

        // Color picker
        const colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.id = `color-${index}`;

        // Set initial color
        if (!fieldColors.has(index)) {
          const defaultColor = defaultColors[index % defaultColors.length];
          const hex = "#" +
            defaultColor.bg
              .match(/\d+/g)
              .slice(0, 3)
              .map((x) => parseInt(x).toString(16).padStart(2, "0"))
              .join("");
          fieldColors.set(index, {
            bg: defaultColor.bg,
            border: defaultColor.border,
            hex: hex,
          });
        }
        colorPicker.value = fieldColors.get(index).hex;

        // Event listeners
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            selectedFields.add(index);
          } else {
            selectedFields.delete(index);
          }
          // Prevent deselecting all fields
          if (selectedFields.size === 0) {
            selectedFields.add(index);
            checkbox.checked = true;
          }
          updateChart(getTableData());
        });

        colorPicker.addEventListener("input", (e) => {
          const hex = e.target.value;
          fieldColors.set(index, {
            hex: hex,
            bg: hexToRGBA(hex, 0.5),
            border: hexToRGBA(hex, 1),
          });
          updateChart(getTableData());
        });

        fieldContainer.appendChild(checkbox);
        fieldContainer.appendChild(label);
        fieldContainer.appendChild(colorPicker);
        fieldList.appendChild(fieldContainer);
      }
    });

    fieldSelectionContainer.appendChild(fieldList);
  }
}

// Function to get data from table inputs
function getTableData() {
  let data = {};
  let labels = [];
  let datasets = [];
  const rows = document.querySelectorAll("tbody tr");

  // First, collect all datasets
  rows.forEach((row, rowIndex) => {
    const inputs = row.querySelectorAll("input");
    inputs.forEach((input, colIndex) => {
      if (input.value.trim()) {
        if (colIndex > 0) {
          datasets[colIndex - 1] = datasets[colIndex - 1] || [];
          datasets[colIndex - 1].push(input.value);
        }

        if (colIndex === 0 && rowIndex > 0) {
          labels.push(input.value);
        }
      }
    });
  });

  // Initialize selectedFields if empty
  if (selectedFields.size === 0 && datasets.length > 0) {
    datasets.forEach((_, index) => selectedFields.add(index));
  }

  // Filter datasets based on selection
  const filteredDatasets = datasets.filter((_, index) => selectedFields.has(index));

  data = { labels: [...labels], datasets: [...filteredDatasets] };
  return data;
}

// Function to read CSV file
function readCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const csvData = event.target.result;
      const rows = csvData.split("\n");
      const data = rows.map((row) => row.split(","));
      resolve(data);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read CSV file"));
    };

    reader.readAsText(file);
  });
}

// Function to populate table with CSV data
function populateTable(csvData) {
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = ""; // Clear existing rows

  const columnCount = csvData[0].length;

  // Update table headers
  const theadRow = table.querySelector("thead tr");
  theadRow.innerHTML = "<th></th>"; // Clear existing headers
  for (let i = 0; i < columnCount; i++) {
    const th = document.createElement("th");
    th.textContent = i + 1;
    theadRow.appendChild(th);
  }

  // Populate rows
  csvData.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = rowIndex + 1;
    tr.appendChild(th);

    row.forEach((cell) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.value = cell.trim();
      input.addEventListener("input", handleInput);
      td.appendChild(input);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

// Function to save current table state to localStorage
function saveToLocalStorage() {
  const tableData = [];
  const rows = table.querySelectorAll("tbody tr");

  rows.forEach((row) => {
    const rowData = [];
    const inputs = row.querySelectorAll("input");
    inputs.forEach((input) => {
      rowData.push(input.value);
    });
    if (rowData.some((value) => value !== "")) {
      // Only save rows that have data
      tableData.push(rowData);
    }
  });

  const chartType = chartTypeSelect.value;
  const savedData = {
    tableData,
    chartType,
  };

  try {
    localStorage.setItem("chartData", JSON.stringify(savedData));
    alert("Data saved successfully!");
  } catch (error) {
    alert("Error saving data: " + error.message);
  }
}

// Function to load table state from localStorage
function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem("chartData");
    if (!savedData) {
      alert("No saved data found");
      return;
    }

    const { tableData, chartType } = JSON.parse(savedData);

    // Set chart type
    chartTypeSelect.value = chartType;

    // Clear existing table
    clearTableData();

    // Populate table with saved data
    populateTable(tableData);

    // Update chart
    const data = getTableData();
    if (data.datasets.length > 0) {
      updateChart(data);
    }

    updateFieldSelections();

    alert("Data loaded successfully!");
  } catch (error) {
    alert("Error loading data: " + error.message);
  }
}

// Function to create/update chart
function updateChart(data) {
  // Destroy existing chart if it exists
  if (currentChart) {
    currentChart.destroy();
  }

  const chartType = chartTypeSelect.value;
  let chartConfig = {};

  switch (chartType) {
    case "line":
      chartConfig = {
        type: "line",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
              backgroundColor:
                fieldColors.get(index)?.bg ||
                defaultColors[index % defaultColors.length].bg,
              borderColor:
                fieldColors.get(index)?.border ||
                defaultColors[index % defaultColors.length].border,
              borderWidth: 1,
            };
          }),
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              display: chartType !== "pie",
            },
          },
        },
      };
      break;
    case "area":
      chartConfig = {
        type: "line",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
              backgroundColor:
                fieldColors.get(index)?.bg ||
                defaultColors[index % defaultColors.length].bg,
              borderColor:
                fieldColors.get(index)?.border ||
                defaultColors[index % defaultColors.length].border,
              borderWidth: 1,
              fill: true,
            };
          }),
        },
        options: {
          responsive: true,
          interaction: {
            mode: "nearest",
            axis: "x",
            intersect: false,
          },
          scales: {
            y: {
              stacked: true,
            },
          },
        },
      };
      break;
    case "bar":
      chartConfig = {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
              backgroundColor:
                fieldColors.get(index)?.bg ||
                defaultColors[index % defaultColors.length].bg,
              borderColor:
                fieldColors.get(index)?.border ||
                defaultColors[index % defaultColors.length].border,
              borderWidth: 1,
            };
          }),
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              display: true,
            },
          },
        },
      };
      break;
    case "s-bar":
      chartConfig = {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
              backgroundColor:
                fieldColors.get(index)?.bg ||
                defaultColors[index % defaultColors.length].bg,
              borderColor:
                fieldColors.get(index)?.border ||
                defaultColors[index % defaultColors.length].border,
              borderWidth: 1,
            };
          }),
        },
        options: {
          responsive: true,
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
            },
          },
        },
      };
      break;
    case "h-bar":
      chartConfig = {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
              backgroundColor:
                fieldColors.get(index)?.bg ||
                defaultColors[index % defaultColors.length].bg,
              borderColor:
                fieldColors.get(index)?.border ||
                defaultColors[index % defaultColors.length].border,
              borderWidth: 1,
            };
          }),
        },
        options: {
          indexAxis: "y",
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              display: true,
            },
          },
        },
      };
      break;
    case "sh-bar":
      chartConfig = {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
              backgroundColor:
                fieldColors.get(index)?.bg ||
                defaultColors[index % defaultColors.length].bg,
              borderColor:
                fieldColors.get(index)?.border ||
                defaultColors[index % defaultColors.length].border,
              borderWidth: 1,
            };
          }),
        },
        options: {
          indexAxis: "y",
          responsive: true,
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
            },
          },
        },
      };
      break;
    case "pie":
      chartConfig = {
        type: "pie",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
            };
          }),
          backgroundColor: [
            data.labels.map((item, index) => {
              return {
                backgroundColor:
                  fieldColors.get(index)?.bg ||
                  defaultColors[index % defaultColors.length].bg,
              };
            }),
          ],
          borderColor: [
            data.labels.map((item, index) => {
              return {
                borderColor:
                  fieldColors.get(index)?.border ||
                  defaultColors[index % defaultColors.length].border,
              };
            }),
          ],
          borderWidth: 1,
        },
        options: {
          responsive: true,
        },
      };
      break;
    case "doughnut":
      chartConfig = {
        type: "doughnut",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
            };
          }),
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(153, 102, 255, 0.5)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
        options: {
          responsive: true,
        },
      };
      break;
    case "radar":
      chartConfig = {
        type: "radar",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((item, index) => {
            return {
              label: item[0],
              data: item.slice(1),
              backgroundColor:
                fieldColors.get(index)?.bg ||
                defaultColors[index % defaultColors.length].bg,
              borderColor:
                fieldColors.get(index)?.border ||
                defaultColors[index % defaultColors.length].border,
              borderWidth: 1,
            };
          }),
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              display: true,
            },
          },
        },
      };
      break;
  }

  currentChart = new Chart(canvas, chartConfig);
}

// Function to add a new row
function addRow() {
  const tbody = table.querySelector("tbody");
  const rowCount = tbody.querySelectorAll("tr").length;
  const columnCount = tbody.querySelector("tr").querySelectorAll("td").length;

  const newRow = document.createElement("tr");
  const rowHeader = document.createElement("th");
  rowHeader.textContent = rowCount + 1;
  newRow.appendChild(rowHeader);

  for (let i = 0; i < columnCount; i++) {
    const newCell = document.createElement("td");
    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.placeholder = "";
    newInput.addEventListener("input", handleInput);
    newCell.appendChild(newInput);
    newRow.appendChild(newCell);
  }

  tbody.appendChild(newRow);
}

// Function to add a new column
function addColumn() {
  const theadRow = table.querySelector("thead tr");
  const newHeader = document.createElement("th");
  newHeader.textContent = theadRow.children.length;
  theadRow.appendChild(newHeader);

  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const newCell = document.createElement("td");
    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.placeholder = "";
    newInput.addEventListener("input", handleInput);
    newCell.appendChild(newInput);
    row.appendChild(newCell);
  });
}

// Handle input event to check if a new row or column is needed
function handleInput(event) {
  const input = event.target;
  const row = input.closest("tr");
  const rowInputs = row.querySelectorAll("input");
  const isLastRow = row.nextElementSibling === null;
  const isLastColumn =
    Array.from(rowInputs).some((input) => input.value === "") &&
    input.closest("td").nextElementSibling === null;

  if (isLastRow && Array.from(rowInputs).some((input) => input.value !== "")) {
    addRow();
  }

  if (isLastColumn) {
    addColumn();
  }

  updateFieldSelections();
}

// Function to clear all table data
function clearTableData() {
  const inputs = table.querySelectorAll("tbody input");
  inputs.forEach((input) => (input.value = ""));
  selectedFields.clear();
  updateFieldSelections();
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
}

// Event Listeners
createChartButton.addEventListener("click", () => {
  const data = getTableData();
  if (data.datasets.length > 0) {
    updateChart(data);
    updateFieldSelections();
  } else {
    alert("Please enter some data in the table");
  }
});

clearTableButton.addEventListener("click", () => {
  clearTableData();
});

csvFileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      const csvData = await readCSV(file);
      populateTable(csvData);
      selectedFields.clear(); // Clear field selections for new data
      updateFieldSelections();
    } catch (error) {
      alert("Error reading CSV file: " + error.message);
    }
  }
});

chartTypeSelect.addEventListener("change", () => {
  const data = getTableData();
  if (data.datasets.length > 0) {
    updateChart(data);
  }
});

saveButton.addEventListener("click", saveToLocalStorage);
loadButton.addEventListener("click", loadFromLocalStorage);

// Attach input listeners to existing inputs
const tableInputs = document.querySelectorAll("table input");
tableInputs.forEach((input) => {
  input.addEventListener("input", handleInput);
});
