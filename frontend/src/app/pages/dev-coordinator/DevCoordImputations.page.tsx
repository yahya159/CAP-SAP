import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarImputations } from '../shared/CalendarImputations';

/**
 * Coordinateur Dev – allocation & assignment with imputation view.
 * Can allocate and assign resources but does not impute hours themselves.
 */
export const DevCoordImputations: React.FC = () => {
  const { t } = useTranslation();

  return (
    <CalendarImputations
      title={t('imputationsPages.devCoordinator.title')}
      subtitle={t('imputationsPages.devCoordinator.subtitle')}
      homePath="/dev-coordinator/dashboard"
      canEdit={false}
      canImpute={false}
    />
  );
};
