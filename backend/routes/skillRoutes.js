const express = require('express');
const { getJobSkills } = require('../controllers/skillController');

const router = express.Router();

router.get('/', getJobSkills);

module.exports = router;
