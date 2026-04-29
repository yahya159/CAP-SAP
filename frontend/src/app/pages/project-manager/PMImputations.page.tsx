import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarImputations } from '../shared/CalendarImputations';

/**
 * Project Manager: validate submitted imputations and send validated periods to Stratime.
 */
export const PMImputations: React.FC = () => {
  const { t } = useTranslation();

  return (
    <CalendarImputations
      title={t('imputationsPages.projectManager.title')}
      subtitle={t('imputationsPages.projectManager.subtitle')}
      homePath="/project-manager/dashboard"
      canEdit={false}
      canImpute={false}
      canValidate
      canSendToStraTIME
    />
  );
};
