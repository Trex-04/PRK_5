// -----------------------------
// 1. MQTT CONFIG
// -----------------------------
const brokerUrl = "wss://1986e0a1ee9641559011881482ca913b.s1.eu.hivemq.cloud:8884/mqtt";
const options = {
  username: "PRK_5",
  password: "Gempabumi5",
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
};

const statusEl = document.getElementById("status");

const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("Terhubung ke HiveMQ Cloud!");
  statusEl.innerHTML = "🟢 <span>Connected</span>";
  client.subscribe("mpu6050/data", (err) => {
    if (!err) {
      console.log("Subscribe ke topic mpu6050/data berhasil");
    }
  });
});

client.on("reconnect", () => {
  statusEl.innerHTML = "🟡 <span>Reconnecting...</span>";
});

client.on("close", () => {
  statusEl.innerHTML = "🔴 <span>Disconnected</span>";
});

client.on("error", (err) => {
  console.error("Koneksi gagal:", err);
  statusEl.innerHTML = "🔴 <span>Error</span>";
});

// -----------------------------
// 2. CHART.JS CONFIG
// -----------------------------
const ctx = document.getElementById("accChart").getContext("2d");
const accChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
  { 
    label: "Getaran (m/s²)", 
    borderColor: "#ffcc00", 
    data: [], 
    fill: false 
  }
    ]
  },
  options: {
    responsive: true,
    animation: false,
    plugins: {
      legend: { labels: { font: { size: 14 } } }
    },
    scales: {
      x: { title: { display: true, text: "Sample" } },
      y: { title: { display: true, text: "Acceleration (g)" } }
    }
  }
});

// -----------------------------
// 3. MQTT DATA HANDLER
// -----------------------------
client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Data diterima:", data);

    // Ambil nilai getaran
    const g = data.Getaran;

    // Update grafik
    accChart.data.labels.push(accChart.data.labels.length + 1);
    accChart.data.datasets[0].data.push(g);

    // Update nilai realtime
    document.getElementById("valG").textContent = g.toFixed(2);

    // Batasi jumlah data
    if (accChart.data.labels.length > 50) {
      accChart.data.labels.shift();
      accChart.data.datasets[0].data.shift();
    }

    // ===============================
    //          UPDATE ALERT
    // ===============================

    const status = data.Status;  // Ambil status dari ESP
    const alertBox = document.getElementById("alertBox");
    const alertText = document.getElementById("alertText");

    // Reset class (menghapus warna sebelumnya)
    alertBox.className = "alert";

    if (status !== "AMAN") {
      alertText.textContent = "Status: " + status;

      if (status === "RINGAN") alertBox.classList.add("ringan");
      if (status === "PARAH") alertBox.classList.add("parah");
      if (status === "TSUNAMI") alertBox.classList.add("tsunami");

      alertBox.classList.remove("hidden");

    } else {
      alertBox.classList.add("hidden");
    }

    // Update grafik
    accChart.update();

  } catch (e) {
    console.error("Error parsing message:", e);
  }
});
