import { classifyWeb3Incident } from '../_shared/web3-taxonomy.ts';

export function classifyCollectedWeb3Incident(
  title: string,
  content: string,
  issueType = '',
  projectCategory = '',
) {
  return classifyWeb3Incident({
    title,
    description: content,
    attackType: issueType,
    projectCategory,
  });
}
