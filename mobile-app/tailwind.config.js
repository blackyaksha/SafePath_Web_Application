/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#FFFFFF',
        secondary: '#C4C98C',
        black: {
          DEFAULT: '#000000',
          100: '#1E1E2D',
          200: '#232533',
        },
        gray: {
          100: '#CECECE',
        },
      },
      fontFamily: {
        ithin: ["Inter-Thin"],
        iextralight: ["Inter-ExtraLight"],
        ilight: ["Inter-Light"],
        iregular: ["Inter-Regular"],
        imedium: ["Inter-Medium"],
        isemibold: ["Inter-SemiBold"],
        ibold: ["Inter-Bold"],
        iextrabold: ["Inter-ExtraBold"],
        iblack: ["Inter-Black"],
      },
    },
  },
  plugins: [],
}