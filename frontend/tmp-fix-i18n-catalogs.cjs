const fs = require('fs');
const path = require('path');

const readJson = (file, fixTrailingBrace = false) => {
  let raw = fs.readFileSync(file, 'utf8');
  if (fixTrailingBrace) {
    raw = raw.replace(/}\s*}$/, '}');
  }
  return JSON.parse(raw);
};

const writeJson = (file, value) => {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const localeDir = path.join(__dirname, 'public', 'locales');
const enPath = path.join(localeDir, 'en', 'translation.json');
const frPath = path.join(localeDir, 'fr', 'translation.json');

const en = readJson(enPath);
const fr = readJson(frPath, true);

en.common.tryAgain = 'Try Again';
en.common.goHome = 'Go Home';
fr.common.tryAgain = 'Réessayer';
fr.common.goHome = "Retour à l'accueil";

en.asyncError = {
  title: 'Application Error',
  description:
    'A critical error occurred. This might be due to a network failure or a technical issue.',
};
fr.asyncError = {
  title: "Erreur de l'application",
  description:
    'Une erreur critique est survenue. Cela peut être lié à un problème réseau ou à un incident technique.',
};

en.imputationsPages = {
  consultantTech: {
    title: 'My Time Entries',
    subtitle: 'Log your working hours using the bi-weekly calendar',
  },
  manager: {
    title: 'Team Time Entries',
    subtitle: 'View and monitor team time entries',
  },
  devCoordinator: {
    title: 'Time Entries & Allocation',
    subtitle: 'Track team time entries and workload distribution',
  },
  projectManager: {
    title: 'Stratime Validation Hub',
    subtitle:
      'Validate submitted team imputations and dispatch validated periods to Stratime',
  },
};
fr.imputationsPages = {
  consultantTech: {
    title: 'Mes saisies de temps',
    subtitle: 'Enregistrez vos heures de travail avec le calendrier bi-hebdomadaire',
  },
  manager: {
    title: "Saisies d'équipe",
    subtitle: "Consultez et suivez les saisies de temps de l'équipe",
  },
  devCoordinator: {
    title: 'Saisies de temps et allocation',
    subtitle: "Suivez les saisies de temps de l'équipe et la répartition de charge",
  },
  projectManager: {
    title: 'Hub de validation Stratime',
    subtitle:
      "Validez les saisies d'équipe soumises et envoyez les périodes validées vers Stratime",
  },
};

en.consultantTech = en.consultantTech || {};
fr.consultantTech = fr.consultantTech || {};

en.consultantTech.certifications = {
  ...(en.consultantTech.certifications || {}),
  addCta: 'Add Certification',
  stats: {
    total: 'Total',
    valid: 'Valid',
    expired: 'Expired',
  },
  table: {
    name: 'Name',
    issuingBody: 'Issuing Body',
    obtained: 'Obtained',
    expires: 'Expires',
    status: 'Status',
  },
  status: {
    VALID: 'Valid',
    EXPIRING_SOON: 'Expiring Soon',
    EXPIRED: 'Expired',
  },
  empty: 'No certifications yet. Click "Add Certification" to get started.',
  dialog: {
    title: 'Add Certification',
    certificateName: 'Certificate Name *',
    certificateNamePlaceholder: 'e.g. SAP Certified Application Associate',
    issuingBody: 'Issuing Body *',
    issuingBodyPlaceholder: 'e.g. SAP',
    dateObtained: 'Date Obtained *',
    expiryDate: 'Expiry Date',
    status: 'Status',
  },
};

fr.consultantTech.certifications = {
  ...(fr.consultantTech.certifications || {}),
  addCta: 'Ajouter une certification',
  stats: {
    total: 'Total',
    valid: 'Valides',
    expired: 'Expirées',
  },
  table: {
    name: 'Nom',
    issuingBody: 'Organisme',
    obtained: 'Obtenue',
    expires: 'Expire',
    status: 'Statut',
  },
  status: {
    VALID: 'Valide',
    EXPIRING_SOON: 'Expire bientôt',
    EXPIRED: 'Expirée',
  },
  empty: 'Aucune certification pour le moment. Cliquez sur "Ajouter une certification" pour commencer.',
  dialog: {
    title: 'Ajouter une certification',
    certificateName: 'Nom de la certification *',
    certificateNamePlaceholder: 'ex. SAP Certified Application Associate',
    issuingBody: 'Organisme émetteur *',
    issuingBodyPlaceholder: 'ex. SAP',
    dateObtained: "Date d'obtention *",
    expiryDate: "Date d'expiration",
    status: 'Statut',
  },
};

en.consultantTech.leaves = {
  ...(en.consultantTech.leaves || {}),
  requestLeave: 'New Request',
  stats: {
    total: 'Total Requests',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    daysTaken: 'Days Taken',
    daysApproved: 'Days Approved',
  },
  table: {
    startDate: 'Start',
    endDate: 'End',
    days: 'Days',
    reason: 'Reason',
    status: 'Status',
    submitted: 'Submitted',
  },
  status: {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  },
  empty: 'No leave requests yet.',
  dialog: {
    title: 'New Leave Request',
    startDate: 'Start Date *',
    endDate: 'End Date *',
    reason: 'Reason',
    reasonPlaceholder: 'Optional reason...',
  },
};

fr.consultantTech.leaves = {
  ...(fr.consultantTech.leaves || {}),
  requestLeave: 'Nouvelle demande',
  stats: {
    total: 'Demandes totales',
    pending: 'En attente',
    approved: 'Approuvées',
    rejected: 'Rejeté',
    daysTaken: 'Jours Pris',
    daysApproved: 'Jours approuvés',
  },
  table: {
    startDate: 'Début',
    endDate: 'Fin',
    days: 'Jours',
    reason: 'Motif',
    status: 'Statut',
    submitted: 'Soumise',
  },
  status: {
    PENDING: 'En attente',
    APPROVED: 'Approuvée',
    REJECTED: 'Rejetée',
  },
  empty: 'Aucune demande de congé pour le moment.',
  dialog: {
    title: 'Nouvelle demande de congé',
    startDate: 'Date de début *',
    endDate: 'Date de fin *',
    reason: 'Motif',
    reasonPlaceholder: 'Motif facultatif...',
  },
};

en.resourceAllocation = {
  title: 'Resource Allocation',
  subtitle: 'Assign consultants to projects and monitor allocation rates',
  generic: {
    project: 'project',
  },
  notification: {
    title: 'New Allocation Assigned',
    message: 'You have been allocated {{percent}}% on {{project}}.',
  },
  form: {
    title: 'New Allocation',
    consultant: 'Consultant',
    selectUser: 'Select user',
    project: 'Project',
    selectProject: 'Select project',
    allocationPercent: 'Allocation %',
    start: 'Start',
    end: 'End',
    saving: 'Saving...',
    add: 'Add Allocation',
  },
  matrix: {
    title: 'Allocation Matrix',
    filterByProject: 'Filter by project',
    allProjects: 'All Projects',
    consultant: 'Consultant',
    project: 'Project',
    allocation: 'Allocation',
    totalPerUser: 'Total/User',
    period: 'Period',
    periodValue: '{{start}} to {{end}}',
    loading: 'Loading allocations...',
    empty: 'No allocations found.',
  },
  delete: {
    title: 'Remove allocation',
    description: 'This allocation entry will be removed from the current dataset.',
    fallbackDescription: 'This action cannot be undone.',
    remove: 'Remove',
  },
  toasts: {
    requiredFields: 'User and project are required',
    invalidDateRange: 'End date cannot be before start date',
    invalidPercent: 'Allocation percent must be between 0 and 100',
    overlappingAllocation:
      'This consultant already has an overlapping allocation for this project',
    exceedsCapacity: 'Allocation exceeds 100% for this user ({{total}}%)',
    created: 'Allocation created',
    createFailed: 'Failed to create allocation',
    updateFailed: 'Failed to update allocation',
    deleted: 'Allocation removed',
    deleteFailed: 'Failed to remove allocation',
  },
};

fr.resourceAllocation = {
  title: 'Allocation des ressources',
  subtitle: "Affectez les consultants aux projets et suivez les taux d'allocation",
  generic: {
    project: 'projet',
  },
  notification: {
    title: 'Nouvelle allocation attribuée',
    message: 'Vous avez été alloué à {{percent}}% sur {{project}}.',
  },
  form: {
    title: 'Nouvelle allocation',
    consultant: 'Consultant',
    selectUser: 'Sélectionner un utilisateur',
    project: 'Projet',
    selectProject: 'Sélectionner un projet',
    allocationPercent: 'Allocation %',
    start: 'Début',
    end: 'Fin',
    saving: 'Enregistrement...',
    add: "Ajouter l'allocation",
  },
  matrix: {
    title: "Matrice d'allocation",
    filterByProject: 'Filtrer par projet',
    allProjects: 'Tous les projets',
    consultant: 'Consultant',
    project: 'Projet',
    allocation: 'Allocation',
    totalPerUser: 'Total/Utilisateur',
    period: 'Période',
    periodValue: '{{start}} à {{end}}',
    loading: 'Chargement des allocations...',
    empty: 'Aucune allocation trouvée.',
  },
  delete: {
    title: "Supprimer l'allocation",
    description: "Cette ligne d'allocation sera supprimée du jeu de données actuel.",
    fallbackDescription: 'Cette action est irréversible.',
    remove: 'Supprimer',
  },
  toasts: {
    requiredFields: "L'utilisateur et le projet sont requis",
    invalidDateRange: 'La date de fin ne peut pas être antérieure à la date de début',
    invalidPercent: "Le pourcentage d'allocation doit être compris entre 0 et 100",
    overlappingAllocation:
      'Ce consultant a déjà une allocation qui chevauche cette période pour ce projet',
    exceedsCapacity: "L'allocation dépasse 100% pour cet utilisateur ({{total}}%)",
    created: 'Allocation créée',
    createFailed: "Échec de la création de l'allocation",
    updateFailed: "Échec de la mise à jour de l'allocation",
    deleted: 'Allocation supprimée',
    deleteFailed: "Échec de la suppression de l'allocation",
  },
};

writeJson(enPath, en);
writeJson(frPath, fr);
