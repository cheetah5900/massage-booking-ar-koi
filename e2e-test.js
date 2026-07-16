import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting E2E test...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    // 1. Navigate to main page
    console.log('🌐 Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    // Reset database to clean state
    console.log('🔄 Resetting database bookings for testing...');
    await page.evaluate(async () => {
      const res = await fetch('/api/db');
      const db = await res.json();
      db.bookings = []; // clear
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
      });
    });
    console.log('✅ Database reset complete!');
    
    // Reload page
    console.log('🔄 Reloading page...');
    await page.reload({ waitUntil: 'networkidle0' });
    
    const pageTitle = await page.$eval('.logo-text', el => el.textContent);
    console.log(`✅ Loaded page with header: "${pageTitle}"`);
    if (pageTitle !== 'จิรภัทร์') {
      throw new Error(`Expected page header to be "จิรภัทร์", got "${pageTitle}"`);
    }
    
    // 2. Verify timetable container is present
    const timetableVisible = await page.$('.timetable-container') !== null;
    console.log(`📅 Timetable grid rendered: ${timetableVisible}`);
    if (!timetableVisible) {
      throw new Error('Timetable container was not found on the page!');
    }
    
    // 3. Test booking creation
    console.log('📝 Attempting to register a new booking queue...');
    
    // Check how many bookings currently exist on the grid
    const initialBookingCount = await page.$$eval('.booking-card', cards => cards.length);
    console.log(`ℹ️ Initial booking count on grid: ${initialBookingCount}`);
    
    // Get native select elements
    const selectElements = await page.$$('select');
    if (selectElements.length < 2) {
      throw new Error('Could not find enough select elements in the booking form');
    }
    
    // Select service option (first select element)
    console.log('👉 Selecting Service...');
    const serviceValue = await page.evaluate((el) => {
      const options = el.querySelectorAll('option');
      return options.length > 1 ? options[1].value : '';
    }, selectElements[0]);
    await page.evaluate((el, val) => {
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, selectElements[0], serviceValue);
    console.log(`✅ Service selected: ${serviceValue}`);
    
    // Select masseuse option (second select element)
    console.log('👉 Selecting Masseuse...');
    const masseuseValue = await page.evaluate((el) => {
      const options = el.querySelectorAll('option');
      return options.length > 1 ? options[1].value : '';
    }, selectElements[1]);
    await page.evaluate((el, val) => {
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, selectElements[1], masseuseValue);
    console.log(`✅ Masseuse selected: ${masseuseValue}`);
    
    // Click submit button
    console.log('🖱️ Clicking "ลงทะเบียนจองคิว" button...');
    await page.click('button[type="submit"]');
    
    // Wait for SweetAlert2 success popup to show up
    console.log('⏳ Waiting for SweetAlert2 success popup...');
    await page.waitForSelector('.swal2-popup', { timeout: 5000 });
    console.log('✅ SweetAlert2 success alert verified!');
    
    // Click the SweetAlert2 confirm button to close it
    await page.click('.swal2-confirm');
    
    // Verify booking card count increased
    await page.waitForFunction((initialCount) => {
      const cards = document.querySelectorAll('.booking-card');
      return cards.length > initialCount;
    }, { timeout: 5000 }, initialBookingCount);
    
    const finalBookingCount = await page.$$eval('.booking-card', cards => cards.length);
    console.log(`🎉 Booking card created successfully! Count went from ${initialBookingCount} to ${finalBookingCount}.`);
    
    console.log('\n🌟 ALL E2E TESTS PASSED SUCCESSFULLY! 🌟');
    process.exit(0);
  } catch (error) {
    console.error('❌ E2E test failed with error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
