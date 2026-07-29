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
        BASE_URL: "http://192.168.3.199:8060/"

    },
    NOTIFICATION: {
        PRE_QUESTIONNAIRE: 'Auditor: {auditorName} has sent PQs of {auditname}  to CASO:  {casoName}.',
        PRE_QUESTIONNAIRE_FollowUp: 'Auditor: {auditorName} has sent follow up queries on PQs of {auditname}  to CASO:  {casoName}.',
        SEND_TO_CASO: 'Pre-questionnaire for {auditname} has been received from auditor- {casoName} to CASO.',        
        SENT_TO_AUDITOR: 'CASO: {casoName} has forwarded response to PQs of {auditname} to Auditor: {auditorName} for review.',        
        NEW_AUDIT_CREATED: 'A new audit {auditname} has been created by APS HQRs. CASO: {casoName} & Auditor : {auditorName}.',        
        AUDIT_COMPLETED: 'Audit - {auditname} process completed and closed successfully by APS HQRs {userName}.',        
        CASO_OBSERVATION_REQUIRED: 'APS HQRs has sent the observations raised during audit of  {auditname}  to CASO: {casoName}.',   
        APS_COMPLIANCE_RESPONSE_CASO_OBSERVATION_REQUIRED: 'APS HQRs has sent response to the compliance of audit observations-  {auditname} , submitted by CASO: {casoName}.',     
        APS_OBSERVATION_REVIEW_REQUIRED: 'Observation compliance status submitted by CASO - {casoName} to APS HQRs for {auditname} , Auditor: {auditorName}.',        
        APS_TO_AUDITOR: 'Audit - {auditname} has been sent back by APS HQRs for correction and resubmission.',
        AUDITOR_TO_APS: 'Auditor: {auditorName} has submitted the final audit report for {auditname} (CASO: {casoName} ) to APS HQRs.'
    }
};