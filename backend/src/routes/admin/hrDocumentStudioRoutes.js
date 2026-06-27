import express from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import { authenticateJWT, requireActiveOrg } from '../../middleware/auth.js';
import ensureAdmin from '../../middleware/ensureAdmin.js';
import { attendanceDB } from '../../config/database.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Guard all routes with Admin + Auth
router.use(authenticateJWT, requireActiveOrg, ensureAdmin);

// POST /api/admin/document-studio/analyze
router.post('/analyze', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload an image screenshot.' });
    }

    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(400).json({ success: false, message: 'GROQ_API_KEY is missing in server environment.' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const systemPrompt = `You are a world-class Senior Frontend Engineer, Vector Graphic Designer, and Multimodal Document OCR Specialist.
Your task is to analyze the provided screenshot of an official document (such as an internship completion certificate, offer letter, or agreement) and synthesize a production-ready, pixel-perfect HTML template, a scoped CSS stylesheet, and dynamic variable definitions.

Follow these strict design rules to achieve the absolute highest replication fidelity while maintaining dynamic compatibility for any organization:
1. **Layout & Print Scoping**:
   - The wrapper must fit an A4 page layout (width: 210mm, min-height: 297mm) with proper print-ready margins (e.g., 22mm top/bottom, 20mm left/right) inside a single page.
   - All CSS styles MUST be strictly scoped under the container selector ".document-render-container" (e.g., ".document-render-container .header", ".document-render-container p") to prevent styles from contaminating the global layout.
2. **Recreating Company Logos Dynamically**:
   - Do NOT output broken or hardcoded image tags (<img src="" />) for the branding logo.
   - To make the template compatible across different organizations, use the dynamic variable tag {{COMPANY_LOGO}} for the image source, and always include an onerror handler to hide the icon if it fails to load:
     <img src="{{COMPANY_LOGO}}" alt="Company Logo" onerror="this.style.display='none';" style="max-height: 50px; object-fit: contain; flex-shrink: 0;" />
   - Alternatively, if the logo is a simple geometric icon (like a triangle, circle, or hexagon) and you wish to represent it visually, you can code a clean, styled inline SVG, but ensure the company name next to it is dynamic.
3. **Divider Lines and Header Skeleton**:
   - Structure the header dynamically using this HTML template skeleton:
     <div class="header-logo-section" style="display: flex; align-items: center; gap: 15px; margin-bottom: 5px;">
       <img src="{{COMPANY_LOGO}}" alt="Company Logo" onerror="this.style.display='none';" style="max-height: 48px; object-fit: contain; flex-shrink: 0;" />
       <div style="display: flex; flex-direction: column; line-height: 1.15;">
         <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 900; color: #0f4c81; letter-spacing: 2px;">{{COMPANY_NAME}}</span>
         <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #334155;">{{COMPANY_SUBTEXT}}</span>
         <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 600; color: #2563eb; font-style: italic; margin-top: 1px;">{{COMPANY_TAGLINE}}</span>
       </div>
     </div>
     <hr style="border: none; border-top: 1.5px solid #000000; margin: 2px 0 3px 0; padding: 0;" />
     <div class="header-metadata" style="display: flex; justify-content: space-between; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10.5px; font-weight: bold; color: #000000; margin-bottom: 30px;">
       <div>GST No.: {{GST_NO}}</div>
       <div>CIN: {{CIN_NO}}</div>
     </div>
4. **Official Stamps & Layering**:
   - Recreate the round stamp/seal in the screenshot using this exact SVG code directly in your HTML, but dynamically replace the uppercase circular and center text with the specific company and location names extracted from the uploaded screenshot:
     <svg viewBox="0 0 100 100" width="105" height="105" style="position: absolute; left: 75px; bottom: 8px; z-index: 1; transform: rotate(-10deg); opacity: 0.75; pointer-events: none;">
       <circle cx="50" cy="50" r="46" fill="none" stroke="#0033cc" stroke-width="2" />
       <circle cx="50" cy="50" r="42" fill="none" stroke="#0033cc" stroke-width="0.75" stroke-dasharray="2 1.5" />
       <defs>
         <path id="stamp-text-path-top" d="M 14 50 A 36 36 0 1 1 86 50" fill="none" />
       </defs>
       <text font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="5" font-weight="900" fill="#0033cc" letter-spacing="0.25">
         <textPath href="#stamp-text-path-top" startOffset="50%" text-anchor="middle">
           [EXTRACTED_STAMP_COMPANY_NAME_IN_UPPERCASE]
         </textPath>
       </text>
       <text x="50" y="48" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="9" font-weight="900" fill="#0033cc" text-anchor="middle" letter-spacing="0.5">[EXTRACTED_STAMP_LOCATION]</text>
       <text x="50" y="62" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="9" font-weight="bold" fill="#0033cc" text-anchor="middle">★</text>
     </svg>
   - Position this stamp absolutely relative to the signature container using "position: absolute" so it overlaps the CEO/authorized signature and name exactly as shown in the screenshot, utilizing transparency (opacity) and low z-index so the signature remains legible.
5. **Signatures**:
   - Recreate handwritten signatures using realistic SVG paths with stroke and rounded cap options to make it look authentic, e.g.:
     <svg viewBox="0 0 120 40" width="130" height="44" style="flex-shrink: 0; pointer-events: none;">
       <path d="M 10 28 C 30 5, 45 35, 55 20 C 65 5, 75 35, 88 15 C 98 0, 108 25, 115 12" fill="none" stroke="#1034a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
       <path d="M 28 32 C 40 12, 58 35, 68 18 C 78 5, 85 28, 92 10" fill="none" stroke="#1034a6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
     </svg>
   - Place a signature border under the signature path, with the signer name (e.g., "Mugilan, CEO") bolded below it.
   - Structure the closing signature block dynamically like this:
     <div class="signatures-section" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-bottom: 25px; position: relative;">
       <div style="position: relative; z-index: 2; width: 200px;">
         <p style="font-weight: bold; margin: 0 0 5px 0; font-size: 13.5px;">Sincerely,</p>
         <div style="height: 50px; display: flex; align-items: center; margin-bottom: 5px;">
           [INSERT_SVG_SIGNATURE_HERE]
         </div>
         <p style="font-weight: bold; border-top: 1.5px solid #000000; padding-top: 4px; width: 140px; margin: 0; font-size: 13px;">{{CEO_NAME}}, CEO</p>
       </div>
       [INSERT_SVG_STAMP_HERE]
     </div>
6. **Justification & Spacing**:
   - Use standard professional serif typography (e.g., Times New Roman) and align paragraphs using \`text-align: justify; text-justify: inter-word;\` with professional line heights (1.6 to 1.8).
7. **Footer Addresses**:
   - Centered footer layouts must be placed at the very bottom of the page, separated from the document body by a thin dividing line, containing the office address, contact number, and email.
8. **Variables Schema Identification**:
   - Extract all dynamic fields (e.g., Candidate Name, Designation, Dates, Reference IDs, Salary Figures) and replace them with uppercase handlebar placeholders: \`{{CANDIDATE_NAME}}\`, \`{{DESIGNATION}}\`, \`{{DATE_OF_ISSUE}}\`, \`{{GST_NO}}\` etc.
   - Map each dynamic key in the variables list. Include the key, a friendly label, data type (text, date, number, or long_text), and a default value extracted from the image.

Your output must be a single, structured JSON block conforming to this schema (do NOT wrap the JSON in markdown code blocks like \`\`\`json, do NOT explain):
{
  "doc_type": "offer_letter" | "policy" | "contract" | "appraisal" | "custom",
  "title": "A descriptive title based on the document type",
  "variables": [
    { "key": "CANDIDATE_NAME", "label": "Candidate name", "type": "text", "defaultValue": "Default Value" }
  ],
  "html_template": "HTML template code containing placeholders and inline SVGs...",
  "css_styles": "CSS styles scoped under .document-render-container..."
}`;

        // Use the multimodal Llama 4 Vision model
        const model = 'meta-llama/llama-4-scout-17b-16e-instruct';

        const response = await groq.chat.completions.create({
            model,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: systemPrompt
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${req.file.mimetype};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_completion_tokens: 4096
        });

        const rawContent = response.choices[0]?.message?.content;
        if (!rawContent) {
            throw new Error('Groq returned an empty layout analysis.');
        }

        // Clean up markdown block wraps (```json or ```) if present
        let cleanedContent = rawContent.trim();
        if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }

        let data;
        try {
            data = JSON.parse(cleanedContent);
        } catch (jsonErr) {
            try {
                // Fallback to evaluating loose JavaScript-like object returned by model
                // (e.g. strings using backticks, unescaped raw quotes, or newlines)
                data = new Function('return ' + cleanedContent)();
            } catch (evalErr) {
                console.error('JSON and eval parsing failed. Raw:', rawContent);
                
                // Final fallback: Regex extraction for critical properties if everything else crashes
                const docTypeMatch = cleanedContent.match(/"doc_type"\s*:\s*["`]?([^"`,\n]+)["`]?/);
                const titleMatch = cleanedContent.match(/"title"\s*:\s*["`]?([^"`,\n]+)["`]?/);
                const htmlMatch = cleanedContent.match(/"html_template"\s*:\s*`([\s\S]*?)`/);
                const cssMatch = cleanedContent.match(/"css_styles"\s*:\s*`([\s\S]*?)`/);
                
                const extractedVars = [];
                const varSectionMatch = cleanedContent.match(/"variables"\s*:\s*\[([\s\S]*?)\]/);
                if (varSectionMatch) {
                    const itemRegex = /\{\s*"key"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*,\s*"defaultValue"\s*:\s*"([^"]*)"\s*\}/g;
                    let m;
                    while ((m = itemRegex.exec(varSectionMatch[1])) !== null) {
                        extractedVars.push({ key: m[1], label: m[2], type: m[3], defaultValue: m[4] });
                    }
                }

                data = {
                    doc_type: docTypeMatch ? docTypeMatch[1] : 'custom',
                    title: titleMatch ? titleMatch[1] : 'Scanned Template',
                    variables: extractedVars,
                    html_template: htmlMatch ? htmlMatch[1] : '',
                    css_styles: cssMatch ? cssMatch[1] : ''
                };
            }
        }
        
        // Normalize keys robustly
        const normalized = {
            doc_type: data.doc_type || data.docType || data.category || 'custom',
            title: data.title || data.template_name || data.templateName || 'Scanned Template',
            variables: data.variables || data.fields || data.variables_schema || data.variablesSchema || [],
            html_template: data.html_template || data.htmlTemplate || data.html || data.html_content || data.htmlContent || '',
            css_styles: data.css_styles || data.cssStyles || data.css || data.css_content || data.cssContent || ''
        };

        res.json({ success: true, data: normalized });

    } catch (error) {
        console.error('Error analyzing layout with Groq Vision:', error);
        res.status(500).json({ success: false, message: 'Layout analysis failed: ' + error.message });
    }
});

// GET /api/admin/document-studio/templates
router.get('/templates', async (req, res) => {
    try {
        const templates = await attendanceDB('custom_document_templates')
            .where({ org_id: req.user.org_id })
            .orderBy('created_at', 'desc');

        templates.forEach(t => {
            if (t.variables_schema) {
                try {
                    t.variables_schema = JSON.parse(t.variables_schema);
                } catch (e) {
                    t.variables_schema = [];
                }
            }
        });

        res.json({ success: true, data: templates });
    } catch (error) {
        console.error('Error fetching custom templates:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin/document-studio/templates
router.post('/templates', async (req, res) => {
    const { template_name, doc_type, html_template, css_styles, variables_schema } = req.body;
    if (!template_name || !html_template) {
        return res.status(400).json({ success: false, message: 'Template name and HTML template are required.' });
    }

    try {
        const [id] = await attendanceDB('custom_document_templates').insert({
            org_id: req.user.org_id,
            template_name,
            doc_type: doc_type || 'custom',
            html_template,
            css_styles: css_styles || '',
            variables_schema: variables_schema ? JSON.stringify(variables_schema) : '[]',
            created_by: req.user.user_id
        });

        const newTemplate = await attendanceDB('custom_document_templates').where({ id }).first();
        if (newTemplate.variables_schema) newTemplate.variables_schema = JSON.parse(newTemplate.variables_schema);

        res.status(201).json({ success: true, data: newTemplate });
    } catch (error) {
        console.error('Error creating custom template:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/admin/document-studio/templates/:id
router.put('/templates/:id', async (req, res) => {
    const { id } = req.params;
    const { template_name, doc_type, html_template, css_styles, variables_schema } = req.body;

    try {
        const affected = await attendanceDB('custom_document_templates')
            .where({ id, org_id: req.user.org_id })
            .update({
                template_name,
                doc_type: doc_type || 'custom',
                html_template,
                css_styles: css_styles || '',
                variables_schema: variables_schema ? JSON.stringify(variables_schema) : '[]',
                updated_at: attendanceDB.fn.now()
            });

        if (!affected) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }

        const updated = await attendanceDB('custom_document_templates').where({ id }).first();
        if (updated.variables_schema) updated.variables_schema = JSON.parse(updated.variables_schema);

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/admin/document-studio/templates/:id
router.delete('/templates/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const affected = await attendanceDB('custom_document_templates')
            .where({ id, org_id: req.user.org_id })
            .del();

        if (!affected) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }

        res.json({ success: true, message: 'Template deleted successfully.' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/admin/document-studio/documents
router.get('/documents', async (req, res) => {
    try {
        const docs = await attendanceDB('generated_hr_documents')
            .where({ org_id: req.user.org_id })
            .orderBy('created_at', 'desc');

        docs.forEach(d => {
            if (d.variables_data) {
                try {
                    d.variables_data = JSON.parse(d.variables_data);
                } catch (e) {
                    d.variables_data = {};
                }
            }
        });

        res.json({ success: true, data: docs });
    } catch (error) {
        console.error('Error fetching generated documents:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin/document-studio/documents
router.post('/documents', async (req, res) => {
    const { template_id, title, doc_type, recipient_name, recipient_email, variables_data, compiled_html } = req.body;
    if (!title || !recipient_name || !compiled_html) {
        return res.status(400).json({ success: false, message: 'Title, recipient name, and compiled HTML snapshot are required.' });
    }

    try {
        const [id] = await attendanceDB('generated_hr_documents').insert({
            org_id: req.user.org_id,
            template_id: template_id || null,
            title,
            doc_type: doc_type || 'custom',
            recipient_name,
            recipient_email: recipient_email || null,
            variables_data: variables_data ? JSON.stringify(variables_data) : '{}',
            compiled_html,
            created_by: req.user.user_id
        });

        const newDoc = await attendanceDB('generated_hr_documents').where({ id }).first();
        if (newDoc.variables_data) newDoc.variables_data = JSON.parse(newDoc.variables_data);

        res.status(201).json({ success: true, data: newDoc });
    } catch (error) {
        console.error('Error saving generated document:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/admin/document-studio/documents/:id
router.delete('/documents/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const affected = await attendanceDB('generated_hr_documents')
            .where({ id, org_id: req.user.org_id })
            .del();

        if (!affected) {
            return res.status(404).json({ success: false, message: 'Document record not found.' });
        }

        res.json({ success: true, message: 'Document record deleted successfully.' });
    } catch (error) {
        console.error('Error deleting document record:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
