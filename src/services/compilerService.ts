import axios from 'axios';
import { ErrorWrapper } from '@/lib/ResponseWrapper';

const JDOODLE_LANG_MAP: Record<string, { lang: string; version: string }> = {
    javascript: { lang: 'nodejs', version: '4' },
    js: { lang: 'nodejs', version: '4' },
    python: { lang: 'python3', version: '4' },
    cpp: { lang: 'cpp17', version: '1' },
    'c++': { lang: 'cpp17', version: '1' },
    c: { lang: 'c', version: '5' },
    java: { lang: 'java', version: '4' },
    rust: { lang: 'rust', version: '4' },
};

export const executeCode = async (language: string, content: string) => {
    const mappedLang = JDOODLE_LANG_MAP[language.toLowerCase()];

    if (!mappedLang) throw new ErrorWrapper(400, `Language '${language}' not supported.`);

    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: content,
        language: mappedLang.lang,
        versionIndex: mappedLang.version,
    });

    return response.data;
};
