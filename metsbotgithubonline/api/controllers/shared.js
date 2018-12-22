function sendJSONresponse (res, status, content) {
    res.status(status).json(content)
  }
  
  module.exports = {
    sendJSONresponse
  }