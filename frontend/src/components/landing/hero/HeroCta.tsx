import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { motion } from 'framer-motion';
import type { SxProps, Theme } from '@mui/material';

interface HeroPrimaryCta {
  label: string;
  onClick: () => void;
  endIcon?: ReactNode;
  sx?: SxProps<Theme>;
}

interface HeroPhoneCta {
  number: string;
  sx?: SxProps<Theme>;
}

interface HeroCtaProps {
  primary: HeroPrimaryCta;
  phone?: HeroPhoneCta;
  center?: boolean;
  spring?: boolean;
}

export default function HeroCta({ primary, phone, center = false, spring = false }: HeroCtaProps) {
  const hoverScale = spring ? 1.08 : 1.04;
  const tapScale = spring ? 0.94 : 0.96;
  const transition = spring ? { type: 'spring' as const, stiffness: 400, damping: 10 } : undefined;
  const motionProps = { whileHover: { scale: hoverScale }, whileTap: { scale: tapScale }, transition } as const;

  return (
    <Box display="flex" gap={2} justifyContent={center ? 'center' : undefined} flexWrap="wrap">
      <motion.div {...motionProps}>
        <Button variant="contained" size="large" onClick={primary.onClick} sx={primary.sx} endIcon={primary.endIcon}>
          {primary.label}
        </Button>
      </motion.div>
      {phone && (
        <motion.div {...motionProps}>
          <Button component="a" href={`tel:${phone.number}`} variant="outlined" size="large" sx={phone.sx} startIcon={<PhoneIcon />}>
            {phone.number}
          </Button>
        </motion.div>
      )}
    </Box>
  );
}
