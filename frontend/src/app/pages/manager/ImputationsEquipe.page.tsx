import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarImputations } from '../shared/CalendarImputations';

export const ImputationsEquipe: React.FC = () => {
  const { t } = useTranslation();

  return (
    <CalendarImputations
      title={t('imputationsPages.manager.title')}
      subtitle={t('imputationsPages.manager.subtitle')}
      homePath="/manager/dashboard"
      canEdit={false}
      canImpute={false}
    />
  );
};
