document.addEventListener('DOMContentLoaded', function () {
    const statusData = {
        labels: ['กำลังทำ', 'เสร็จสิ้น', 'แก้ไข'],
        datasets: [{
          data: [
            <%= statusCounts.working %>,
            <%= statusCounts.complete %>,
            <%= statusCounts.fix %>
          ],
          backgroundColor: ['#B4B4B8', '#9BCF53', '#FF6868'],
          hoverBackgroundColor: ['#C7C8CC', '#BFEA7C', '#FF8F8F']
        }]
      };
    
      // ตรวจสอบว่าข้อมูลทั้งหมดเป็น 0 หรือไม่
      function isDataEmpty(dataArray) {
        return dataArray.every(value => value === 0);
      }
    
      // สร้างกราฟ
      const ctxStatus = document.getElementById('statusChart').getContext('2d');
      const chartConfig = {
        type: 'pie', // เปลี่ยนเป็น Pie Chart
        data: statusData,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function(tooltipItem) {
                  return `สถานะ: ${tooltipItem.label} (${tooltipItem.raw})`;
                }
              }
            }
          }
        }
      };
    
      // หากข้อมูลเป็น 0 ทั้งหมด แสดงข้อความบอกว่าไม่มีงาน
      if (isDataEmpty(statusData.datasets[0].data)) {
        chartConfig.data = {
          labels: ['ไม่มีข้อมูล'],
          datasets: [{
            data: [1], // ค่าข้อมูลกราฟที่ทำให้แสดงวงกลมว่าง
            backgroundColor: ['#E0E0E0'], // สีของกราฟที่ไม่มีข้อมูล
            hoverBackgroundColor: ['#E0E0E0']
          }]
        };
        chartConfig.options.plugins.tooltip.enabled = false; // ปิด tooltip เพราะไม่มีข้อมูลจริง
      }
    
      new Chart(ctxStatus, chartConfig);
      const priorityData = {
        labels: ['ยังไม่ได้กำหนด', 'สูง', 'ปกติ', 'ต่ำ'],
        datasets: [{
          label: 'งาน',
          data: [4, 2, 1, 3], // จำนวนงานในแต่ละระดับ
          backgroundColor: ['#d3d3d3', '#ff4c4c', '#ffa500', '#800080'], // สีของแต่ละระดับ
          borderColor: ['#c0c0c0', '#e60000', '#cc8400', '#660066'], // สีขอบ
          borderWidth: 1
        }]
      };
    
      const priorityConfig = {
        type: 'bar',
        data: priorityData,
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 10
            },
            x: {
              ticks: {
                font: {
                  size: 9 // กำหนดขนาดฟอนต์สำหรับป้ายชื่อในแกน X
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false // ซ่อนคำอธิบายใต้กราฟ
            }
          }
        }
      };
    
      const ctxPriority = document.getElementById('priorityChart').getContext('2d');
      ctxStatus.canvas.height = 250; // กำหนดความสูงของกราฟ
      new Chart(ctxPriority, priorityConfig);
});

document.addEventListener('DOMContentLoaded', function () {
    const workloadData = <% - workloadChartData %>;

    // Function to generate a random pastel color
    function getRandomPastelColor() {
        const r = Math.floor(Math.random() * 127 + 128);
        const g = Math.floor(Math.random() * 127 + 128);
        const b = Math.floor(Math.random() * 127 + 128);
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }

    // Assign a unique random pastel color to each dataset and remove borders
    workloadData.datasets.forEach((dataset) => {
        dataset.backgroundColor = dataset.data.map(() => getRandomPastelColor());
        dataset.borderWidth = 0; // Remove the outlines
    });

    // Workload Chart (Bar Chart)
    const ctxWorkload = document.getElementById('workloadChart').getContext('2d');
    new Chart(ctxWorkload, {
        type: 'bar',
        data: workloadData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'start'
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return `ภาระงาน: ${tooltipItem.raw} งาน`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'ผู้ใช้'
                    },
                    grid: {
                        display: false // Remove x-axis grid lines
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'ภาระงาน'
                    },
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            return value;
                        }
                    },
                    grid: {
                        display: false // Remove y-axis grid lines
                    }
                }
            }
        }
    });

    // Data for status chart
    const statusData = {
        labels: ['กำลังทำ', 'เสร็จสิ้น', 'แก้ไข'],
        datasets: [{
            data: [
      <%= statusCounts.working %>,
      <%= statusCounts.complete %>,
      <%= statusCounts.fix %>
    ],
            backgroundColor: ['#B4B4B8', '#9BCF53', '#FF6868'],
            hoverBackgroundColor: ['#C7C8CC', '#BFEA7C', '#FF8F8F']
        }]
    };

    function isDataEmpty(dataArray) {
        return dataArray.every(value => value === 0);
    }

    // Status Chart (Doughnut Chart)
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    new Chart(ctxStatus, {
        type: 'doughnut',
        data: statusData,
        options: {
            cutout: '60%',
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return `สภานะ: ${tooltipItem.label} (${tooltipItem.raw})`;
                        }
                    }
                }
            }
        }
    });
});