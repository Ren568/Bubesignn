// ===================
// Base UI
// ===================

// ปีใน footer
document.getElementById('year').textContent = new Date().getFullYear();

// เมนูมือถือ
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
if (toggle) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// Smooth scroll (ปรับ offset สำหรับ header)
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href');
    if(id.length > 1){
      const el = document.querySelector(id);
      if(el){
        e.preventDefault();
        const y = el.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top:y, behavior:'smooth' });
        nav.classList.remove('open');
        toggle?.setAttribute('aria-expanded','false');
      }
    }
  });
});


// ===================
// ส่งฟอร์ม → Google Sheets (ผ่าน Apps Script)
// ===================

/* ====== ส่งฟอร์ม → Google Sheets (ผ่าน Apps Script) ====== */
/* ใช้แบบ FormData + no-cors เพื่อตัดปัญหา CORS/preflight */

const SHEET_ID   = '12G-mv_hJIqtFlkEvW25Aq1fMEj-GJLFQYNFwsbmkX6c'; // ของคุณ
const SHEET_NAME = 'bu';
const HEADERS    = ['Timestamp','Name','Email','Message'];
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzHNQ2TkdKu7Q1bPjSUh7ZbA8ey_8xy0m17Ep6wfV9_HXO6PALirOFmPxzc7B2sMg8kog/exec';
		


async function handleSubmit(e){
  e.preventDefault();
  const form = e.target;
  const note = document.getElementById('formNote');

  // เก็บค่าจากอินพุต (name/email/message ต้องตรงกับ name ใน HTML)
  const fd = new FormData();
  fd.append('name',    form.name.value.trim());
  fd.append('email',   form.email.value.trim());
  fd.append('message', form.message.value.trim());

  // แจ้งสถานะผู้ใช้
  if (note) note.textContent = 'กำลังส่ง...';

  try {
    // no-cors: ส่งได้แน่นอน เบราว์เซอร์จะไม่เช็ค CORS (อ่าน response ไม่ได้ แต่ชีตจะบันทึก)
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: fd
    });

    if (note) note.textContent = 'ส่งสำเร็จ! เราได้รับข้อความแล้ว 🙏';
    form.reset();
  } catch (err) {
    if (note) note.textContent = 'ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
    console.error(err);
  }
  return false;
}

					 



// ถ้าอยากผูกด้วย JS แทน onsubmit ใน HTML ให้ยกคอมเมนต์บรรทัดล่างนี้ แล้วลบ onsubmit ที่แท็ก <form>
// document.querySelector('.contact-form')?.addEventListener('submit', handleSubmit);


// ===================
// Work grid → Carousel
// ===================

(function(){
  const grid = document.querySelector('.work-grid');
  if (!grid) return;

  // เปิดโหมดคารูเซลด้วยคลาส (ไม่แก้ HTML)
  grid.classList.add('is-carousel');

  // ถ้ามีการ์ดน้อยกว่า 6 ชิ้น ให้โคลนเพิ่มจากใบที่มี
  const cards = Array.from(grid.children).filter(el => el.classList.contains('work-card'));
  if (cards.length === 0) return; // ต้องมีอย่างน้อย 1 ใบ

  while (grid.querySelectorAll('.work-card').length < 6) {
    const currentCount = grid.querySelectorAll('.work-card').length;
    const next = cards[currentCount % cards.length];
    grid.appendChild(next.cloneNode(true));
  }

  // ใส่คลาส .scrolling ตอนเลื่อน เพื่อทำ motion blur
  let t;
  grid.addEventListener('scroll', ()=>{
    grid.classList.add('scrolling');
    clearTimeout(t);
    t = setTimeout(()=> grid.classList.remove('scrolling'), 140);
  }, {passive:true});

  // รองรับลากเพื่อเลื่อน (เมาส์/ทัช)
  let isDown = false, startX = 0, startLeft = 0;
  const onDown = (e) => {
    isDown = true;
    grid.classList.add('dragging');
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    startLeft = grid.scrollLeft;
  };
  const onMove = (e) => {
    if (!isDown) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    grid.scrollLeft = startLeft - (x - startX);
  };
  const onUp = () => {
    isDown = false;
    grid.classList.remove('dragging');
  };

  grid.addEventListener('mousedown', onDown);
  grid.addEventListener('mousemove', onMove);
  grid.addEventListener('mouseleave', onUp);
  grid.addEventListener('mouseup', onUp);
  grid.addEventListener('touchstart', onDown, {passive:true});
  grid.addEventListener('touchmove', onMove, {passive:true});
  grid.addEventListener('touchend', onUp);

  // กันคลิกพลาดตอนกำลังลาก
  grid.addEventListener('click', (e)=>{
    if (grid.classList.contains('dragging')) e.preventDefault();
  }, true);
})();


// ===================
// UX: ล้อเมาส์แนวตั้ง → เลื่อนแนวนอน + คีย์บอร์ด
// ===================

(function(){
  const grid = document.querySelector('.work-grid.is-carousel');
  if(!grid) return;

  // หมุนล้อเมาส์ขึ้น/ลง = เลื่อนซ้าย/ขวา
  grid.addEventListener('wheel', (e)=>{
    if(Math.abs(e.deltaY) > Math.abs(e.deltaX)){
      grid.scrollLeft += e.deltaY;
      e.preventDefault(); // ต้องไม่ passive เพื่อยับยั้งการสกรอลล์หน้าจอ
    }
  }, { passive: false });

  // ให้โฟกัสได้ แล้วเลื่อนด้วยปุ่มลูกศรซ้าย/ขวา
  grid.setAttribute('tabindex', '0');
  grid.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowRight'){
      grid.scrollBy({ left: grid.clientWidth * 0.8, behavior: 'smooth' });
    }else if(e.key === 'ArrowLeft'){
      grid.scrollBy({ left: -grid.clientWidth * 0.8, behavior: 'smooth' });
    }
  });
})();
