export const homeSections = [
  { id: 'work', label: 'بطاقات العلامات التجارية', defaultVisible: true },
  { id: 'logos', label: 'شبكة الشعارات', defaultVisible: true },
  { id: 'campaigns', label: 'الحملات التسويقية', defaultVisible: false },
  { id: 'typography', label: 'الخطوط الطباعية', defaultVisible: false },
  { id: 'services', label: 'الخدمات والتواصل', defaultVisible: true },
  { id: 'about', label: 'النبذة الشخصية', defaultVisible: true },
];
export function sectionIsVisible(content, id) {
  const saved = content?.sectionVisibility?.[id];
  return typeof saved === 'boolean' ? saved : homeSections.find(section => section.id === id)?.defaultVisible === true;
}
