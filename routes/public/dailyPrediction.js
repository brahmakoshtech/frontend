// src/routes/public/dailyPrediction.js

import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * Get daily nakshatra prediction (no authentication required)
 * POST /api/public/daily-prediction
 * Body: {
 *   day: 10,
 *   month: 5,
 *   year: 1990,
 *   hour: 19,
 *   min: 55,
 *   lat: 19.20,
 *   lon: 25.2,
 *   tzone: 5.5
 * }
 */
router.post('/daily-prediction', async (req, res) => {
  try {
    const { day, month, year, hour, min, lat, lon, tzone } = req.body;

    // Validate required fields
    if (!day || !month || !year || !hour || min === undefined || !lat || !lon || !tzone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: {
          day: 'Day of birth (1-31)',
          month: 'Month of birth (1-12)',
          year: 'Year of birth',
          hour: 'Hour of birth (0-23)',
          min: 'Minute of birth (0-59)',
          lat: 'Latitude',
          lon: 'Longitude',
          tzone: 'Timezone (e.g., 5.5 for IST)'
        }
      });
    }

    // Validate numeric values
    const numericValidations = {
      day: { value: day, min: 1, max: 31 },
      month: { value: month, min: 1, max: 12 },
      year: { value: year, min: 1900, max: new Date().getFullYear() },
      hour: { value: hour, min: 0, max: 23 },
      min: { value: min, min: 0, max: 59 },
      lat: { value: lat, min: -90, max: 90 },
      lon: { value: lon, min: -180, max: 180 }
    };

    for (const [field, { value, min, max }] of Object.entries(numericValidations)) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < min || numValue > max) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}. Must be between ${min} and ${max}`
        });
      }
    }

    // Prepare data for astrology API
    const apiData = {
      day: parseInt(day),
      month: parseInt(month),
      year: parseInt(year),
      hour: parseInt(hour),
      min: parseInt(min),
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      tzone: parseFloat(tzone)
    };

    // Convert to URL-encoded format
    const urlEncodedData = Object.keys(apiData)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(apiData[key])}`)
      .join('&');

    console.log('[Public API] Fetching daily nakshatra prediction...');

    // Call Astrology API
    const apiUrl = process.env.ASTROLOGY_API_BASE_URL || 'https://json.astrologyapi.com/v1';
    const response = await axios.post(
      `${apiUrl}/daily_nakshatra_prediction`,
      urlEncodedData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          username: process.env.ASTROLOGY_API_USER_ID,
          password: process.env.ASTROLOGY_API_KEY
        },
        timeout: 30000
      }
    );

    console.log('[Public API] Daily prediction fetched successfully');

    res.json({
      success: true,
      data: response.data,
      requestedFor: {
        date: `${day}/${month}/${year}`,
        time: `${hour}:${min}`,
        location: { lat, lon },
        timezone: tzone
      }
    });

  } catch (error) {
    console.error('[Public API] Daily prediction error:', error.message);
    
    if (error.response) {
      // API returned an error
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Failed to fetch daily prediction from astrology service',
        error: process.env.NODE_ENV === 'development' ? error.response.data : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get daily prediction with date of birth (simplified input)
 * POST /api/public/daily-prediction/simple
 * Body: {
 *   dob: "1990-05-10",
 *   timeOfBirth: "19:55",
 *   latitude: 19.20,
 *   longitude: 25.2,
 *   timezone: 5.5 (optional, defaults to 5.5 IST)
 * }
 */
router.post('/daily-prediction/simple', async (req, res) => {
  try {
    const { dob, timeOfBirth, latitude, longitude, timezone } = req.body;

    // Validate required fields
    if (!dob || !timeOfBirth || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: {
          dob: 'Date of birth (YYYY-MM-DD)',
          timeOfBirth: 'Time of birth (HH:MM)',
          latitude: 'Latitude',
          longitude: 'Longitude',
          timezone: 'Timezone (optional, defaults to 5.5 for IST)'
        }
      });
    }

    // Parse date of birth
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Parse time of birth
    const [hour, min] = timeOfBirth.split(':').map(Number);
    if (isNaN(hour) || isNaN(min) || hour < 0 || hour > 23 || min < 0 || min > 59) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM (24-hour format)'
      });
    }

    // Prepare data for astrology API
    const apiData = {
      day: birthDate.getDate(),
      month: birthDate.getMonth() + 1,
      year: birthDate.getFullYear(),
      hour: hour,
      min: min,
      lat: parseFloat(latitude),
      lon: parseFloat(longitude),
      tzone: timezone ? parseFloat(timezone) : 5.5
    };

    // Convert to URL-encoded format
    const urlEncodedData = Object.keys(apiData)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(apiData[key])}`)
      .join('&');

    console.log('[Public API] Fetching daily nakshatra prediction (simple)...');

    // Call Astrology API
    const apiUrl = process.env.ASTROLOGY_API_BASE_URL || 'https://json.astrologyapi.com/v1';
    const response = await axios.post(
      `${apiUrl}/daily_nakshatra_prediction`,
      urlEncodedData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          username: process.env.ASTROLOGY_API_USER_ID,
          password: process.env.ASTROLOGY_API_KEY
        },
        timeout: 30000
      }
    );

    console.log('[Public API] Daily prediction fetched successfully');

    res.json({
      success: true,
      data: response.data,
      requestedFor: {
        dob,
        timeOfBirth,
        location: { latitude, longitude },
        timezone: apiData.tzone
      }
    });

  } catch (error) {
    console.error('[Public API] Daily prediction (simple) error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Failed to fetch daily prediction from astrology service',
        error: process.env.NODE_ENV === 'development' ? error.response.data : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;