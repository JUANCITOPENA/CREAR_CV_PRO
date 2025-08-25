document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const cvForm = document.getElementById('cv-form');
    const previewContainer = document.getElementById('cv-preview');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const saveCvBtn = document.getElementById('save-cv-btn');
    const newCvBtn = document.getElementById('new-cv-btn');
    const historyListContainer = document.getElementById('history-list');
    const loadingOverlay = document.getElementById('loading-overlay');

    // --- DICCIONARIO DE ICONOS DE HABILIDADES ---
    const skillIcons = {
        'html': 'devicon-html5-plain colored', 'html5': 'devicon-html5-plain colored',
        'css': 'devicon-css3-plain colored', 'css3': 'devicon-css3-plain colored',
        'javascript': 'devicon-javascript-plain colored', 'js': 'devicon-javascript-plain colored',
        'react': 'devicon-react-original colored',
        'angular': 'devicon-angularjs-plain colored',
        'vue': 'devicon-vuejs-plain colored', 'vuejs': 'devicon-vuejs-plain colored',
        'node': 'devicon-nodejs-plain colored', 'nodejs': 'devicon-nodejs-plain colored',
        'python': 'devicon-python-plain colored',
        'php': 'devicon-php-plain colored',
        'java': 'devicon-java-plain colored',
        'c#': 'devicon-csharp-plain colored', 'csharp': 'devicon-csharp-plain colored',
        'sql': 'devicon-mysql-plain colored', 'mysql': 'devicon-mysql-plain colored', 'postgresql': 'devicon-postgresql-plain colored',
        'mongodb': 'devicon-mongodb-plain colored',
        'git': 'devicon-git-plain colored',
        'github': 'fab fa-github',
        'docker': 'devicon-docker-plain colored',
        'wordpress': 'fab fa-wordpress',
        'figma': 'devicon-figma-plain colored',
        'excel': 'fas fa-file-excel',
        'power bi': 'fas fa-chart-bar',
        'vercel': 'fas fa-cloud',
        'vsc': 'devicon-visualstudio-plain colored', 'visual studio code': 'devicon-visualstudio-plain colored',
        'typescript': 'devicon-typescript-plain colored', 'ts': 'devicon-typescript-plain colored',
        'bootstrap': 'devicon-bootstrap-plain colored',
        'sass': 'devicon-sass-original colored',
        '_default': 'fas fa-check-circle'
    };

    function getSkillIcon(skill) {
        const cleanSkill = skill.trim().toLowerCase();
        return skillIcons[cleanSkill] || skillIcons._default;
    }

    // --- SISTEMA DE NOTIFICACIONES ---
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        const iconClass = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
        toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.classList.add('show'); }, 100);
        setTimeout(() => { toast.classList.remove('show'); toast.addEventListener('transitionend', () => toast.remove()); }, 3000);
    }

    // --- LÓGICA DE PERSISTENCIA Y MANEJO DE DATOS ---
    function getFormDataAsObject() {
        const data = { id: document.getElementById('cv-id').value || Date.now().toString() };
        ['name', 'title', 'email', 'phone', 'linkedin', 'github', 'location', 'summary', 'skills'].forEach(id => {
            data[id] = document.getElementById(`cv-${id}`).value;
        });
        data.experience = Array.from(document.querySelectorAll('.experience-form')).map(form => ({ title: form.querySelector('[name="job-title"]').value, company: form.querySelector('[name="company"]').value, dates: form.querySelector('[name="dates"]').value, description: form.querySelector('[name="description"]').value }));
        data.education = Array.from(document.querySelectorAll('.education-form')).map(form => ({ degree: form.querySelector('[name="degree"]').value, university: form.querySelector('[name="university"]').value, dates: form.querySelector('[name="dates"]').value }));
        data.extra = Array.from(document.querySelectorAll('.extra-form')).map(form => ({ course: form.querySelector('[name="course"]').value, institution: form.querySelector('[name="institution"]').value }));
        data.references = Array.from(document.querySelectorAll('.reference-form')).map(form => ({ name: form.querySelector('[name="ref-name"]').value, title: form.querySelector('[name="ref-title"]').value, contact: form.querySelector('[name="ref-contact"]').value }));
        return data;
    }

    function populateFormFromObject(data) {
        experienceCount = 0; educationCount = 0; extraCount = 0; referenceCount = 0;
        ['experience', 'education', 'extra', 'reference'].forEach(type => { document.getElementById(`${type}-entries`).innerHTML = ''; });
        document.getElementById('cv-id').value = data.id || '';
        Object.keys(data).forEach(key => { const element = document.getElementById(`cv-${key}`); if (element) element.value = data[key] || ''; });
        createDynamicEntries('experience', data.experience, addExperienceEntry, (form, item) => { form.querySelector('[name="job-title"]').value = item.title; form.querySelector('[name="company"]').value = item.company; form.querySelector('[name="dates"]').value = item.dates; form.querySelector('[name="description"]').value = item.description; });
        createDynamicEntries('education', data.education, addEducationEntry, (form, item) => { form.querySelector('[name="degree"]').value = item.degree; form.querySelector('[name="university"]').value = item.university; form.querySelector('[name="dates"]').value = item.dates; });
        createDynamicEntries('extra', data.extra, addExtraEntry, (form, item) => { form.querySelector('[name="course"]').value = item.course; form.querySelector('[name="institution"]').value = item.institution; });
        createDynamicEntries('reference', data.references, addReferenceEntry, (form, item) => { form.querySelector('[name="ref-name"]').value = item.name; form.querySelector('[name="ref-title"]').value = item.title; form.querySelector('[name="ref-contact"]').value = item.contact; });
        updateCvPreview();
        saveCurrentDraft();
    }

    function saveCurrentDraft() {
        try {
            const data = getFormDataAsObject();
            localStorage.setItem('cvDraft', JSON.stringify(data));
        } catch (error) {
            console.error("Error al autoguardar el borrador:", error);
            showToast('Error al guardar el borrador automático.', 'error');
            if (error.name === 'QuotaExceededError') { showToast('Almacenamiento lleno. Libera espacio.', 'error'); }
        }
    }

    function loadCurrentDraft() {
        const draftString = localStorage.getItem('cvDraft');
        if (!draftString) {
            startNewCv(false);
            return;
        }
        try {
            const draftData = JSON.parse(draftString);
            if (draftData && typeof draftData === 'object') {
                populateFormFromObject(draftData);
            } else {
                console.warn("Borrador corrupto. Empezando un nuevo CV.");
                startNewCv(false);
            }
        } catch (error) {
            console.error("Error al parsear borrador:", error);
            showToast("No se pudo cargar el borrador guardado, podría estar corrupto.", "error");
            startNewCv(false);
        }
    }

    // --- EVENT LISTENERS ---
    cvForm.addEventListener('input', () => { updateCvPreview(); saveCurrentDraft(); });
    document.getElementById('add-experience-btn').addEventListener('click', addExperienceEntry);
    document.getElementById('add-education-btn').addEventListener('click', addEducationEntry);
    document.getElementById('add-extra-btn').addEventListener('click', addExtraEntry);
    document.getElementById('add-reference-btn').addEventListener('click', addReferenceEntry);
    exportPdfBtn.addEventListener('click', exportToPdf);
    saveCvBtn.addEventListener('click', saveCvToHistory);
    newCvBtn.addEventListener('click', () => startNewCv(true));

    // --- ACTUALIZACIÓN DE LA VISTA PREVIA ---
    function updateCvPreview() {
        const data = getFormDataAsObject();
        const contactHtml = `${data.location ? `<div class="contact-item"><i class="fas fa-map-marker-alt"></i><span>${data.location}</span></div>` : ''}${data.email ? `<div class="contact-item"><i class="fas fa-envelope"></i><span>${data.email}</span></div>` : ''}${data.phone ? `<div class="contact-item"><i class="fas fa-phone"></i><span>${data.phone}</span></div>` : ''}${data.linkedin ? `<div class="contact-item"><i class="fab fa-linkedin"></i><span><a href="${data.linkedin}" target="_blank">${formatUrl(data.linkedin)}</a></span></div>` : ''}${data.github ? `<div class="contact-item"><i class="fab fa-github"></i><span><a href="${data.github}" target="_blank">${formatUrl(data.github)}</a></span></div>` : ''}`;
        const skillsHtml = (data.skills || '').split(',').map(s => s.trim()).filter(s => s).map(skill => `<div class="skill-item"><i class="${getSkillIcon(skill)}"></i><span>${skill}</span></div>`).join('');
        const experienceHtml = (data.experience || []).filter(e => e.title || e.company).map(e => `<div class="experience-entry"><h3>${e.title}</h3><div class="experience-meta">${e.company} | ${e.dates}</div><ul>${(e.description || '').split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^-/, '').trim()}</li>`).join('')}</ul></div>`).join('');
        const educationHtml = (data.education || []).filter(e => e.degree || e.university).map(e => `<div class="education-entry"><h3>${e.degree}</h3><div class="education-meta">${e.university} | ${e.dates}</div></div>`).join('');
        const extraHtml = (data.extra || []).filter(e => e.course).map(e => `<div class="education-entry"><h3>${e.course}</h3><div class="education-meta">${e.institution}</div></div>`).join('');
        const referenceHtml = (data.references || []).filter(r => r.name).map(r => `<div class="reference-item"><h3>${r.name}</h3><p>${r.title}</p><p><i class="fas fa-envelope"></i> ${r.contact}</p></div>`).join('');

        previewContainer.innerHTML = `
            <header class="cv-header"><h1>${data.name || 'Tu Nombre'}</h1><p>${data.title || 'Tu Título Profesional'}</p></header>
            <aside class="cv-sidebar">
                <section class="cv-section"><h2><i class="fas fa-user-circle"></i> Contacto</h2>${contactHtml}</section>
                ${(data.education && data.education.some(e => e.degree || e.university)) ? `<section class="cv-section"><h2><i class="fas fa-graduation-cap"></i> Educación</h2>${educationHtml}</section>` : ''}
                ${(data.extra && data.extra.some(e => e.course)) ? `<section class="cv-section"><h2><i class="fas fa-star"></i> Cursos</h2>${extraHtml}</section>` : ''}
            </aside>
            <main class="cv-main">
                ${data.summary ? `<section class="cv-section"><h2><i class="fas fa-bullseye"></i> Resumen</h2><p class="summary-text">${data.summary.replace(/\n/g, '<br>')}</p></section>` : ''}
                ${(data.experience && data.experience.some(e => e.title || e.company)) ? `<section class="cv-section"><h2><i class="fas fa-briefcase"></i> Experiencia</h2>${experienceHtml}</section>` : ''}
                ${skillsHtml ? `<section class="cv-section"><h2><i class="fas fa-lightbulb"></i> Habilidades</h2><div class="skills-container">${skillsHtml}</div></section>` : ''}
                ${(data.references && data.references.some(r => r.name)) ? `<section class="cv-section"><h2><i class="fas fa-heart"></i> Referencias</h2><div class="references-container">${referenceHtml}</div></section>` : ''}
            </main>
            <footer class="cv-final-note"><p class="m-0">Si quieres saber más información de mí, contacta una cita y te muestro mis habilidades, proyectos y qué tan valioso puedo ser para ti.</p></footer>`;
    }

    // --- MANEJO DE ENTRADAS DINÁMICAS ---
    let experienceCount = 0, educationCount = 0, extraCount = 0, referenceCount = 0;
    function addExperienceEntry() { experienceCount++; const entryDiv = document.createElement('div'); entryDiv.className = 'experience-form border p-3 rounded mb-3'; entryDiv.innerHTML = `<h5>Experiencia #${experienceCount}</h5><input type="text" name="job-title" class="form-control form-control-sm mb-2" placeholder="Cargo"><input type="text" name="company" class="form-control form-control-sm mb-2" placeholder="Empresa y Ciudad"><input type="text" name="dates" class="form-control form-control-sm mb-2" placeholder="Ej: Ene 2020 - Dic 2022"><textarea name="description" class="form-control form-control-sm" rows="3" placeholder="- Logro 1...&#10;- Logro 2..."></textarea>`; document.getElementById('experience-entries').appendChild(entryDiv); }
    function addEducationEntry() { educationCount++; const entryDiv = document.createElement('div'); entryDiv.className = 'education-form border p-3 rounded mb-3'; entryDiv.innerHTML = `<h5>Formación #${educationCount}</h5><input type="text" name="degree" class="form-control form-control-sm mb-2" placeholder="Título Obtenido"><input type="text" name="university" class="form-control form-control-sm mb-2" placeholder="Institución"><input type="text" name="dates" class="form-control form-control-sm" placeholder="Ej: 2015 - 2019">`; document.getElementById('education-entries').appendChild(entryDiv); }
    function addExtraEntry() { extraCount++; const entryDiv = document.createElement('div'); entryDiv.className = 'extra-form border p-3 rounded mb-3'; entryDiv.innerHTML = `<h5>Curso #${extraCount}</h5><input type="text" name="course" class="form-control form-control-sm mb-2" placeholder="Nombre del Curso o Certificación"><input type="text" name="institution" class="form-control form-control-sm" placeholder="Institución Emisora">`; document.getElementById('extra-entries').appendChild(entryDiv); }
    function addReferenceEntry() { referenceCount++; const entryDiv = document.createElement('div'); entryDiv.className = 'reference-form border p-3 rounded mb-3'; entryDiv.innerHTML = `<h5>Referencia #${referenceCount}</h5><input type="text" name="ref-name" class="form-control form-control-sm mb-2" placeholder="Nombre de Contacto"><input type="text" name="ref-title" class="form-control form-control-sm mb-2" placeholder="Cargo y Empresa"><input type="text" name="ref-contact" class="form-control form-control-sm" placeholder="Email o Teléfono">`; document.getElementById('reference-entries').appendChild(entryDiv); }
    function createDynamicEntries(type, items, addFunction, populateFunction) { if (items && items.length > 0) items.forEach(item => { addFunction(); const forms = document.querySelectorAll(`.${type}-form`); populateFunction(forms[forms.length - 1], item); }); }

    // --- LÓGICA DEL HISTORIAL ---
    function saveCvToHistory() {
        try {
            const cvData = getFormDataAsObject();
            if (!cvData.name.trim()) { alert('Por favor, ingresa al menos un nombre para guardar el CV.'); return; }
            let history = [];
            const historyString = localStorage.getItem('cvHistory');
            if (historyString) {
                try {
                    const parsed = JSON.parse(historyString);
                    if (Array.isArray(parsed)) history = parsed;
                } catch (e) { console.error("Historial corrupto, se sobreescribirá."); }
            }
            const existingIndex = history.findIndex(cv => cv.id == cvData.id);
            if (existingIndex > -1) { history[existingIndex] = cvData; } else { history.push(cvData); }
            localStorage.setItem('cvHistory', JSON.stringify(history));
            showToast('¡CV guardado en tu historial!', 'success');
            renderHistory();
        } catch (error) {
            console.error("Error al guardar CV en el historial:", error);
            showToast('Error al guardar el CV.', 'error');
            if (error.name === 'QuotaExceededError') { showToast('¡Almacenamiento local lleno!', 'error'); alert('Tu navegador no tiene más espacio para guardar CVs.'); }
        }
    }

    function renderHistory() {
        let history = [];
        try {
            const historyString = localStorage.getItem('cvHistory');
            const parsedData = historyString ? JSON.parse(historyString) : [];
            if (Array.isArray(parsedData)) { history = parsedData; }
        } catch (error) {
            console.error("Error al cargar el historial de CVs:", error);
            showToast("No se pudo cargar el historial, podría estar corrupto.", "error");
        }
        historyListContainer.innerHTML = history.length === 0 ? '<div class="col-12"><p class="text-center text-muted">Aún no has guardado ningún CV.</p></div>' : history.map(cv => `<div class="col-md-4"><div class="history-card"><h5>${cv.name}</h5><p class="text-muted mb-2">${cv.title || 'Sin título'}</p><button class="btn btn-sm btn-primary edit-cv-btn" data-id="${cv.id}">Editar</button> <button class="btn btn-sm btn-danger delete-cv-btn" data-id="${cv.id}">Eliminar</button></div></div>`).join('');
    }

    historyListContainer.addEventListener('click', e => {
        const id = e.target.dataset.id; if (!id) return;
        if (e.target.classList.contains('edit-cv-btn')) { let history = JSON.parse(localStorage.getItem('cvHistory')); const cvToLoad = history.find(cv => cv.id == id); if (cvToLoad) { populateFormFromObject(cvToLoad); alert('CV cargado en el editor.'); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
        if (e.target.classList.contains('delete-cv-btn')) { if (confirm('¿Estás seguro de que quieres eliminar este CV?')) { let history = JSON.parse(localStorage.getItem('cvHistory')); history = history.filter(cv => cv.id != id); localStorage.setItem('cvHistory', JSON.stringify(history)); renderHistory(); } }
    });

    function startNewCv(confirmFirst = true) {
        const doReset = () => { cvForm.reset(); document.getElementById('cv-id').value = ''; ['experience', 'education', 'extra', 'reference'].forEach(type => { document.getElementById(`${type}-entries`).innerHTML = ''; window[`${type}Count`] = 0; }); localStorage.removeItem('cvDraft'); addExperienceEntry(); addEducationEntry(); addReferenceEntry(); updateCvPreview(); };
        if (confirmFirst) { if (confirm('¿Estás seguro? Se borrarán los datos no guardados del formulario actual.')) { doReset(); } } else { doReset(); }
    }

    // --- EXPORTACIÓN A PDF Y FUNCIONES AUXILIARES ---
    async function exportToPdf() {
        const cvToExport = document.getElementById('cv-preview');
        const cvName = document.getElementById('cv-name').value.trim();
        if (!cvName) { alert('Por favor, ingresa al menos tu nombre completo.'); return; }

        loadingOverlay.classList.add('active');
        document.body.classList.add('exporting-pdf');

        try {
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(cvToExport, { scale: 3, useCORS: true, logging: false, windowWidth: cvToExport.scrollWidth, windowHeight: cvToExport.scrollHeight });
            const imgData = canvas.toDataURL('image/png');
            const imgWidthPx = canvas.width;
            const imgHeightPx = canvas.height;

            let pdfFormat = 'letter';
            const LETTER_WIDTH_IN = 8.5;
            const LETTER_HEIGHT_IN = 11;
            const scaledHeightForLetterWidth = (imgHeightPx * LETTER_WIDTH_IN) / imgWidthPx;
            if (scaledHeightForLetterWidth > LETTER_HEIGHT_IN) {
                pdfFormat = 'legal';
                alert("El contenido es extenso. Se generará un PDF en formato Oficio/Legal (8.5x14) para que todo quepa.");
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: pdfFormat });
            const pdfPageWidth = pdf.internal.pageSize.getWidth();
            const pdfPageHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfPageWidth, pdfPageHeight);
            pdf.save(`${cvName.replace(/\s+/g, '_')}_CV.pdf`);

        } catch (error) {
            console.error('Error al generar el PDF:', error);
            showToast('Ocurrió un error al generar el PDF.', 'error');
        } finally {
            document.body.classList.remove('exporting-pdf');
            loadingOverlay.classList.remove('active');
        }
    }

    function formatUrl(url) {
        if (!url) return '';
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) { cleanUrl = 'https://' + cleanUrl; }
        return cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
    }

    // --- INICIALIZACIÓN ---
    loadCurrentDraft();
    renderHistory();
});
