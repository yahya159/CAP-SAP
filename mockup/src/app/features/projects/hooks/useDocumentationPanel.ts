import { useState } from 'react';
import { useProjectDocumentation } from '../queries';
import { countDocumentationByType } from '../model';
import { DocumentationObjectType } from '@/app/types/entities';

export const useDocumentationPanel = (projectId: string, techKeywords: string[] = []) => {
  const { data: documentationObjects = [] } = useProjectDocumentation(projectId);
  
  const [docText, setDocText] = useState('');
  
  return {
    projectKeywords: techKeywords,
    documentationObjects,
    docText,
    docSaving: false,
    onDocTextChange: setDocText,
    onSaveDocText: async () => {},
    getCountByType: (type: DocumentationObjectType) => countDocumentationByType(documentationObjects, type),
  };
};