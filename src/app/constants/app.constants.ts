export const APP_CONSTANTS = {
  
    APP_NAME: 'Audit System',

    STATUS: {
        APSHQRS: 'APSHQrs',
        CASO: 'CASO',
        DROPOUT: 'Dropout'
    },

    MESSAGES: {
        REQUIRED_FIELDS: 'Please fill all required fields.',
        ADD_QUESTION: 'Please add at least one question before submitting the audit.'
    },

    FILES: {
        BASE_URL: "http://localhost:8060/"
    },
    NOTIFICATION: {
        PRE_QUESTIONNAIRE: 'Pre-questionnaire for {auditname} has been received from auditor : {auditorName} to CASO.',
        SEND_TO_CASO: 'Pre-questionnaire for {auditname} has been received from auditor- {casoName} to CASO.',        
        SENT_TO_AUDITOR: 'Pre-questionnaire Answers for {auditname} has been submitted by CASO - {casoName} to Auditor for review.',        
        NEW_AUDIT_CREATED: 'A new audit has been created by APS HQRs and has been assigned to Auditor -{auditname} .',        
        AUDIT_COMPLETED: 'Audit - {auditname} process completed and closed successfully by APS HQRs.',        
        CASO_OBSERVATION_REQUIRED: 'Observation for {auditname} has been raised for compliance status from APS HQRs- {userName} to CASO.',        
        APS_OBSERVATION_REVIEW_REQUIRED: 'Observation compliance status submitted by CASO - {casoName} to APS HQRs for {auditname} .',        
        APS_TO_AUDITOR: 'Audit - {auditname} has been sent back by APS HQRs for correction and resubmission.',
        AUDITOR_TO_APS: 'Final audit report submitted by auditor to APS HQRs for {auditname} Auditor - {auditorName}.'
    }
};