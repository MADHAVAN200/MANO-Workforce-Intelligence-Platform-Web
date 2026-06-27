import api from './api';

const hrDocumentStudioService = {
    analyzeScreenshot: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/admin/document-studio/analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    getCustomTemplates: async () => {
        const res = await api.get('/admin/document-studio/templates');
        return res.data;
    },

    saveCustomTemplate: async (templateData) => {
        const res = await api.post('/admin/document-studio/templates', templateData);
        return res.data;
    },

    updateCustomTemplate: async (id, templateData) => {
        const res = await api.put(`/admin/document-studio/templates/${id}`, templateData);
        return res.data;
    },

    deleteCustomTemplate: async (id) => {
        const res = await api.delete(`/admin/document-studio/templates/${id}`);
        return res.data;
    },

    getGeneratedDocuments: async () => {
        const res = await api.get('/admin/document-studio/documents');
        return res.data;
    },

    saveGeneratedDocument: async (documentData) => {
        const res = await api.post('/admin/document-studio/documents', documentData);
        return res.data;
    },

    deleteGeneratedDocument: async (id) => {
        const res = await api.delete(`/admin/document-studio/documents/${id}`);
        return res.data;
    }
};

export default hrDocumentStudioService;
