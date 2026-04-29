import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarImputations } from '../shared/CalendarImputations';

export const MesImputations: React.FC = () => {
  const { t } = useTranslation();

  return (
    <CalendarImputations
      title={t('imputationsPages.consultantTech.title')}
      subtitle={t('imputationsPages.consultantTech.subtitle')}
      homePath="/consultant-tech/dashboard"
      canEdit={true}
      canImpute={true}
    />
  );
};

