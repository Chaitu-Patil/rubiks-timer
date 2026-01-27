const timer = document.getElementById("timer")
  const hint = document.getElementById("hint")
  const bestEl = document.getElementById("best")
  const avgEl = document.getElementById("average")
  const logEl = document.getElementById("log")

  let startTime = 0
  let elapsed = 0
  let interval = null
  let running = false
  let holding = false

  let solves = []

  function format(ms) {
    let totalSeconds = Math.floor(ms / 1000)
    let minutes = Math.floor(totalSeconds / 60)
    let seconds = totalSeconds % 60
    let centiseconds = Math.floor((ms % 1000) / 10)
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`
  }

  function update() {
    elapsed = performance.now() - startTime
    timer.textContent = format(elapsed)
  }

  function getBest() {
    return solves.length ? Math.min(...solves) : null
  }

  function getAverage() {
    if (!solves.length) return null
    return solves.reduce((a, b) => a + b, 0) / solves.length
  }

  function updateSidebar() {
    const best = getBest()
    const avg = getAverage()
    bestEl.textContent = best ? format(best) : "—"
    avgEl.textContent = avg ? format(avg) : "—"
    renderLog()
  }

  function renderLog() {
    logEl.innerHTML = ""
    for (let i = solves.length - 1; i >= 0; i--) {
      const div = document.createElement("div")
      div.textContent = `${i + 1}. ${format(solves[i])}`
      logEl.appendChild(div)
    }
  }

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

    if (!running) {
      timer.classList.remove("ready")
      hint.textContent = "Press space to stop"
      startTime = performance.now()
      interval = setInterval(update, 10)
      running = true
    } else {
      clearInterval(interval)
      running = false
      solves.push(elapsed)
      updateSidebar()
      hint.textContent = "Hold space to start"
    }

    holding = false
  })
