/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        grape:'#8E6BFF', mint:'#3FD09E', sunshine:'#FFC83D', coral:'#FF7B5C',
        sky:'#5BC5FF', rose:'#FF6FA8', ink:'#231347', cream:'#FFF7EA',
        'grape-dark':'#5A3BD1','mint-dark':'#1F9A6E','sun-dark':'#B97808',
        'coral-dark':'#D45F22','sky-dark':'#2890D0','rose-dark':'#C73C77',
      },
      fontFamily: {
        fredoka:['"Fredoka"','system-ui','sans-serif'],
        nunito:['"Nunito"','system-ui','sans-serif'],
      },
      animation: {
        'bounce-in':'bounceIn 0.4s cubic-bezier(0.36,0.07,0.19,0.97)',
        'wiggle':'wiggle 0.5s ease-in-out',
        'float':'float 3s ease-in-out infinite',
        'spin-slow':'spin 2s linear infinite',
        'accessory-float':'accessoryFloat 2.6s ease-in-out infinite',
      },
      keyframes: {
        bounceIn:{'0%':{transform:'scale(0.3)',opacity:'0'},'70%':{transform:'scale(1.1)'},'100%':{transform:'scale(1)',opacity:'1'}},
        wiggle:{'0%,100%':{transform:'rotate(-4deg)'},'50%':{transform:'rotate(4deg)'}},
        float:{'0%,100%':{transform:'translateY(0px)'},'50%':{transform:'translateY(-8px)'}},
        accessoryFloat:{'0%,100%':{transform:'translateY(0px) rotate(0deg)'},'50%':{transform:'translateY(-5px) rotate(3deg)'}},
      },
    },
  },
  plugins: [],
};
