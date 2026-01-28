/* ================== elements ================== */

const timer = document.getElementById("timer")
const hint = document.getElementById("hint")

const bestEl = document.getElementById("best")
const avgEl = document.getElementById("average")
const logEl = document.getElementById("log")

const graphBtn = document.getElementById("viewGraph")
const backBtn = document.getElementById("back")
const graphViewEl = document.getElementById("graphView")
const timerViewEl = document.getElementById("timerView")

const canvas = document.getElementById("graph")
const ctx = canvas.getContext("2d")

/* ================== state ================== */

let startTime = 0
let interval = null
let running = false
let holding = false

let times = []
let points = []
let hoverPoint = null

/* ================== formatting ================== */

function format(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const cs = Math.floor((ms % 1000) / 10)

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${cs
    .toString()
    .padStart(2, "0")}`
}

/* ================== timer ================== */

function update() {
  timer.textContent = format(performance.now() - startTime)
}

function start() {
  startTime = performance.now()
  interval = setInterval(update, 10)
  running = true
  hint.textContent = "Press space to stop"
}

function stop() {
  clearInterval(interval)
  running = false

  const elapsed = performance.now() - startTime
  times.push(elapsed)

  addLog(elapsed)
  updateStats()
}

/* ================== keyboard ================== */

document.addEventListener("keydown", e => {
  if (e.code !== "Space" || holding || e.repeat) return
  e.preventDefault()

  holding = true

  if (!running) {
    timer.classList.add("ready")
    hint.textContent = "Release to start"
  }
})

document.addEventListener("keyup", e => {
  if (e.code !== "Space") return
  e.preventDefault()

  timer.classList.remove("ready")

  if (!running) start()
  else stop()

  holding = false
})

/* ================== stats ================== */

function getBest() {
  return times.length ? Math.min(...times) : null
}

function getAverage() {
  if (!times.length) return null
  return times.reduce((a, b) => a + b, 0) / times.length
}

function updateStats() {
  const best = getBest()
  const avg = getAverage()

  bestEl.textContent = best ? format(best) : "—"
  avgEl.textContent = avg ? format(avg) : "—"
}

/* ================== log ================== */

function addLog(ms) {
  const div = document.createElement("div")
  div.textContent = `${times.length}. ${format(ms)}`
  logEl.prepend(div)
}

/* ================== graph ================== */

function drawGraph() {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!times.length) return

  const padding = 48
  const w = canvas.width - padding * 2
  const h = canvas.height - padding * 2

  // Integer second Y-axis
  const minSec = Math.floor(Math.min(...times) / 1000)
  const maxSec = Math.ceil(Math.max(...times) / 1000)
  const rangeSec = maxSec - minSec || 1

  const yValue = t => {
    const sec = t / 1000
    return padding + h - ((sec - minSec) / rangeSec) * h
  }

  points = []

  /* ----- grid + Y-axis labels ----- */
  ctx.fillStyle = "#9ca3af"
  ctx.strokeStyle = "#1f2937"
  ctx.font = "12px system-ui"

  for (let i = 0; i <= rangeSec; i++) {
    const secValue = minSec + i
    const y = padding + h - (i / rangeSec) * h

    ctx.fillText(`${secValue}s`, 6, y + 4)

    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(canvas.width - padding, y)
    ctx.stroke()
  }

  /* ----- line ----- */
  ctx.strokeStyle = "#ffffff99"
  ctx.lineWidth = 2
  ctx.beginPath()

  times.forEach((t, i) => {
    const x =
      padding + (times.length === 1 ? w / 2 : (i / (times.length - 1)) * w)
    const y = yValue(t)

    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)

    points.push({ x, y, time: t })
  })

  ctx.stroke()

  /* ----- average line ----- */
  const avg = getAverage()
  if (avg) {
    const avgY = yValue(avg)
    ctx.strokeStyle = "#00ff9c"
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(padding, avgY)
    ctx.lineTo(canvas.width - padding, avgY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = "#00ff9c"
    ctx.fillText(`Avg: ${format(avg)}`, canvas.width - padding - 90, avgY - 6)
  }

  /* ----- points ----- */
  points.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p === hoverPoint ? 6 : 4, 0, Math.PI * 2)
    ctx.fillStyle = "#3b82f6"
    ctx.fill()
  })

  /* ----- axis labels ----- */
  ctx.fillStyle = "#9ca3af"
  ctx.save()
  ctx.translate(16, canvas.height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText("Time (mm:ss)", 0, 0)
  ctx.restore()
  ctx.fillText("Solve #", canvas.width / 2 - 25, canvas.height - 10)

  /* ----- tooltip ----- */
  if (hoverPoint) {
    ctx.fillStyle = "#000"
    ctx.fillRect(hoverPoint.x + 8, hoverPoint.y - 24, 84, 18)

    ctx.fillStyle = "#fff"
    ctx.font = "12px monospace"
    ctx.fillText(format(hoverPoint.time), hoverPoint.x + 12, hoverPoint.y - 10)
  }
}

/* ================== hover ================== */

canvas.addEventListener("mousemove", e => {
  hoverPoint = null
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  for (let p of points) {
    if (Math.hypot(mx - p.x, my - p.y) < 6) {
      hoverPoint = p
      break
    }
  }

  drawGraph()
})

canvas.addEventListener("mouseleave", () => {
  hoverPoint = null
  drawGraph()
})

/* ================== navigation ================== */

graphBtn.onclick = () => {
  timerViewEl.style.display = "none"
  graphViewEl.style.display = "flex"
  drawGraph()
}

backBtn.onclick = () => {
  graphViewEl.style.display = "none"
  timerViewEl.style.display = "flex"
}
