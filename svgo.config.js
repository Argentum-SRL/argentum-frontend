export default {
  plugins: [
    'preset-default',
    {
      name: 'removeViewBox',
      active: false   // mantener viewBox — necesario para que escalen bien
    }
  ]
}
