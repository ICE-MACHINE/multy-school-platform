import { useState } from 'react';
import { Button, Menu, MenuItem, ListItemText } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';

const LABELS: Record<SupportedLanguage, string> = { en: 'English', fr: 'Français', ar: 'العربية' };
const SHORT: Record<SupportedLanguage, string> = { en: 'EN', fr: 'FR', ar: 'AR' };

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const current = (SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as SupportedLanguage)
    ? i18n.resolvedLanguage
    : 'en') as SupportedLanguage;

  return (
    <>
      <Button
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<LanguageIcon />}
        endIcon={<ExpandMoreIcon />}
        aria-label={t('common.language')}
        sx={{ minWidth: 44, minHeight: 44, textTransform: 'none', fontWeight: 600 }}
      >
        {compact ? SHORT[current] : LABELS[current]}
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {SUPPORTED_LANGUAGES.map((lng) => (
          <MenuItem
            key={lng}
            selected={lng === current}
            onClick={() => { void i18n.changeLanguage(lng); setAnchor(null); }}
          >
            <ListItemText>{LABELS[lng]}</ListItemText>
            {lng === current && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
