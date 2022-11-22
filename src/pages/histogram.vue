<script setup lang="ts">
import Chart from 'chart.js/auto'

const { files, open } = useFileDialog()

const canvas = ref()

let imageData: ImageData
const data = ref<Uint8ClampedArray>()

const mapRtoOtherChannels = (newData: Uint8ClampedArray) => {
  for (let i = 1; i < newData.length; i++) {
    if (i % 4 !== 0 && i % 4 !== 3)
      newData[i] = newData[i - (i % 4)]
  }
}

watchPostEffect(() => {
  if (!canvas.value || !files.value || files.value.length === 0)
    return

  const context: CanvasRenderingContext2D = canvas.value.getContext('2d')

  const file = files.value[0]
  const img = new Image()
  img.src = URL.createObjectURL(file)
  img.onload = () => {
    canvas.value.width = img.width
    canvas.value.height = img.height
    context.drawImage(img, 0, 0)

    imageData = context.getImageData(0, 0, img.width, img.height)
    const newData = new Uint8ClampedArray(imageData.data)
    // mapRtoOtherChannels(newData)

    data.value = newData
  }
})

const labels = [...Array(256).keys()]
const histogramData = computed(() => {
  const histogramData: [number[], number[], number[]] = [[], [], []]
  for (const i of labels) {
    histogramData[0][i] = 0
    histogramData[1][i] = 0
    histogramData[2][i] = 0
  }

  const canvasData = data.value
  if (canvasData) {
    for (let i = 0; i < canvasData.length; i += 4) {
      histogramData[0][canvasData[i]] += 1
      histogramData[1][canvasData[i + 1]] += 1
      histogramData[2][canvasData[i + 2]] += 1
    }
  }

  return histogramData
})

const histogramChart = ref()
const chart = shallowRef()
const chartData: [number[], number[], number[]] = [[], [], []]
onMounted(() => {
  chart.value = new Chart(histogramChart.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: chartData[0],
        },
        // {
        //   data: chartData[1],
        // },
        // {
        //   data: chartData[2],
        // },
      ],
    },
    options: {
      animation: false,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
})

watchEffect(() => {
  if (chart.value) {
    const data = histogramData.value
    console.log(data)
    for (let i = 0; i < 3; ++i) {
      chartData[i].length = 0
      chartData[i].push(...data[i])
    }

    chart.value.update()
  }
})

const expand = () => {
  const hData = histogramData.value
  const newData = new Uint8ClampedArray(data.value!)

  for (let channel = 0; channel < hData.length; ++channel) {
    let min = Infinity
    let max = 0
    for (let i = 0; i < hData[channel].length; ++i) {
      if (hData[channel][i] === 0)
        continue

      min = Math.min(min, i)
      max = Math.max(max, i)
    }

    if (min === Infinity)
      min = 0

    for (let i = channel; i < newData.length; i += 4)
      newData[i] = (newData[i] - min) / (max - min) * 255
  }

  // mapRtoOtherChannels(newData)

  data.value = newData
}

const equalize = () => {
  const hData = histogramData.value
  const lut: [number[], number[], number[]] = [[], [], []]
  const newData = new Uint8ClampedArray(data.value!)

  const n = newData.length
  const scaleFactor = 255 / n * 4

  for (let channel = 0; channel < hData.length; ++channel) {
    for (let i = 0; i < 256; ++i)
      lut[channel][i] = 0

    let sum = 0

    for (let i = 0; i < 256; ++i) {
      sum += hData[channel][i]
      lut[channel][i] = sum * scaleFactor & 0xFF
    }

    for (let i = channel; i < n; i += 4)
      newData[i] = lut[channel][newData[i]]
  }

  // mapRtoOtherChannels(newData)

  data.value = newData
}

const mBin = ref(false)
const meanBin = ref(false)
const pBlackBin = ref(false)
const threshold = ref(0xFF / 2)

watch([data, mBin, threshold], ([data]) => {
  if (!data)
    return

  if (mBin.value) {
    const t = threshold.value
    data = data
      .map((v, i) => {
        if (i % 4 !== 0 && i % 4 !== 3)
          return data![i - (i % 4)]

        return v
      })
      .map((v, i) => v > t || i % 4 === 3 ? 255 : 0)
  }

  else if (pBlackBin.value) {
    const numpix = data.length / 4 * (threshold.value / 255)
    let count = 0
    const hData = histogramData.value
    let i = 0
    for (i = 0; i < 256; i++) {
      count += hData[0][i]

      if (count > numpix)
        break
    }

    const t = Math.min(255, i)
    data = data
      .map((v, i) => {
        if (i % 4 !== 0 && i % 4 !== 3)
          return data![i - (i % 4)]

        return v
      })
      .map((v, i) => v > t || i % 4 === 3 ? 255 : 0)
  }

  else if (meanBin.value) {
    const hData = histogramData.value[0]

    let hMean = 0
    for (let i = 0; i < 256; i++)
      hMean += i * hData[i]
    console.log(hMean)
    hMean = hMean / (data.length / 4)
    console.log(hMean)

    let t = Math.round(hMean)
    let tkm1 = t

    do {
      tkm1 = t

      let a = 0
      let b = 0
      let c = 0
      let d = 0

      for (let i = 0; i <= t; i++) {
        const h = hData[i]
        a += i * h
        b += h
      }

      b += b

      for (let i = t + 1; i < 256; i++) {
        const h = hData[i]
        c += i * h
        d += h
      }

      d += d

      t = Math.floor(a / b + c / d)
      console.log(t, a, b, c, d)
    } while (t !== tkm1)

    data = data
      .map((v, i) => {
        if (i % 4 !== 0 && i % 4 !== 3)
          return data![i - (i % 4)]

        return v
      })
      .map((v, i) => v > t || i % 4 === 3 ? 255 : 0)
  }

  imageData.data.set(data)
  const context: CanvasRenderingContext2D = canvas.value.getContext('2d')
  context.putImageData(imageData, 0, 0)
})
</script>

<template>
  <div class="grid grid-cols-3 h-screen">
    <div class="relative">
      <div class="absolute inset-0 flex">
        <div v-if="files" class="m-auto">
          <canvas ref="canvas" class="max-w-full" />
        </div>
        <div v-else class="m-auto border-2 border-gray-400 text-gray-400 p-30 border-dashed rounded-xl" @click="open()">
          Upload a photo
        </div>
      </div>
    </div>
    <div class="border-l-1 border-gray-400 p-8">
      <canvas ref="histogramChart" />
    </div>
    <div class="border-l-1 border-gray-400 p-8">
      <div>
        <label>Histogram</label>
        <fw-button icon="bi-x-square-fill" secondary @click="expand" />
        <fw-button icon="bi-back" secondary @click="equalize" />
      </div>
      <div class="pt-4">
        <label>Manual binarization</label>
        <fw-toggle v-model="mBin" />
      </div>
      <div class="pt-4">
        <label>Black percent</label>
        <fw-toggle v-model="pBlackBin" />
      </div>
      <div class="pt-4">
        <label>Mean</label>
        <fw-toggle v-model="meanBin" />
        <input v-model.number="threshold" type="range" min="-1" max="255" step="any">
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
label {
  text-transform: uppercase;
  font-size: 0.6em;
  color: var(--fw-gray-700);
  display: block;
}
</style>
