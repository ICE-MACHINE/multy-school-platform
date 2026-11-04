import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MoreVert from '@mui/icons-material/MoreVert';

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  onClick: () => void;
}

export default function ActionsMenu({ items, size = 'small' }: { items: ActionItem[]; size?: 'small' | 'medium' }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  return (
    <>
      <IconButton
        size={size}
        onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
        onMouseDown={(e) => e.stopPropagation()}
        sx={{ color: 'text.secondary' }}
      >
        <MoreVert fontSize={size} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 200, boxShadow: 8 } } }}
      >
        {items.map((it, i) => (
          <MenuItem
            key={i}
            onClick={() => { setAnchor(null); it.onClick(); }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {it.icon && <ListItemIcon sx={{ color: it.color, minWidth: 32 }}>{it.icon}</ListItemIcon>}
            <ListItemText sx={{ color: it.color }}>{it.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
