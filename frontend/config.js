// Adresse des Backends – lässt sich über die Umgebungsvariable BACKEND_URL ändern
module.exports = {
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3000'
};
