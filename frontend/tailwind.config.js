module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      'sans': ['Helvetica', 'Arial', 'sans-serif'],
      'display': ['Edge-regular', 'Edge-bold'],
    },
    extend: {
      colors: {
        'nav': '#2A4759',
        'panel1': '#687E8C',
        'panel2': '#BFBCBA',
        'panel3': '#B4CED9',
        'nav-dark': '#c3c8cf',
        'panel1-dark': '#030304',
        'panel2-dark': '#535457',
        'panel3-dark': '#033f52',
        'panel4-dark': '#01212b',
        'stjude': '#911938',
        'white': '#fff',
        'bsk_opp': '#CCA791',
        'bsk_blue': '#CFE5FF',
        'bsk_dark_blue': '#7F97B3',
        'primary': '#687E8C',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
