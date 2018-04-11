// Grab JSON data from Node instance
import getJson from 'load-json'
const data = getJson(global.baseURL.concat('dataJSON'))
window.console.log(data)
export default { data }
