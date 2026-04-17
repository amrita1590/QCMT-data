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
        BASE_URL: "http://192.168.11.8:8060/"
    },
    NOTIFICATION: {
        PRE_QUESTIONNAIRE: 'Pre-questionnaire for {auditname} has been received from auditor : {auditorName}.',
        SEND_TO_CASO: 'Pre-questionnaire for {auditname} has been received from auditor - {casoName}.',        
        SENT_TO_AUDITOR: 'Audit - {auditname} has been submited by CASO - {casoName} for review.',        
        NEW_AUDIT_CREATED: 'A new audit created {auditname} and has been assigned to you.',        
        AUDIT_COMPLETED: 'Audit - {auditname} process completed and closed successfully by APS.',        
        CASO_OBSERVATION_REQUIRED: 'Observation for {auditname} has been received from APS - {userName}.',        
        APS_OBSERVATION_REVIEW_REQUIRED: 'Observation submited for {auditname} for APS review and approval by CASO - {casoName}.',        
        APS_TO_AUDITOR: 'Audit - {auditname} has been sent back by APS for correction and resubmission.',
        AUDITOR_TO_APS: 'Audit final report submitted for {auditname} has been received from auditor - {auditorName}.'
    }
};