const express = require('express')
const passport = require('passport')
const router = express.Router()

router.post('/admin', passport.authenticate('local', { failureRedirect: '/err' }), (req, res) => {
  req.session.user = req.session.passport.user
  res.redirect('/?logged-in=' + Math.random().toString().slice(2).slice(0, 5))
})

module.exports = router
