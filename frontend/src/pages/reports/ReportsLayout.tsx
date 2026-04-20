import React, { useState } from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Toolbar,
    IconButton,
    useTheme,
    useMediaQuery,
    Divider,
    Button
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    ElectricBolt as PowerIcon,
    Thermostat as CoolingIcon,
    Assessment as QualityIcon,
    Menu as MenuIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { sectionTitleClass } from '../../styles/designSystem';

const drawerWidth = 260;

interface ReportsLayoutProps {
    children: React.ReactNode;
    activeSection: 'executive' | 'power' | 'cooling' | 'quality';
    onSectionChange: (section: 'executive' | 'power' | 'cooling' | 'quality') => void;
    onBack: () => void; // New prop for back navigation
}

const ReportsLayout: React.FC<ReportsLayoutProps> = ({ children, activeSection, onSectionChange, onBack }) => {
    const theme = useTheme();
    const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { id: 'executive', label: 'ภาพรวมผู้บริหาร', icon: <DashboardIcon /> },
        { id: 'power', label: 'พลังงานและไฟฟ้า', icon: <PowerIcon /> },
        { id: 'cooling', label: 'ความเย็นและสภาพแวะล้อม', icon: <CoolingIcon /> },
        { id: 'quality', label: 'คุณภาพข้อมูล', icon: <QualityIcon /> },
    ];

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ px: 2, minHeight: 64, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Back Button in Sidebar Header for Quick Return */}
                <IconButton onClick={onBack} size="small" sx={{ mr: 1, color: theme.palette.text.secondary }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" className={sectionTitleClass} sx={{ pt: 0.5 }}>
                    Reports
                </Typography>
            </Toolbar>
            <Divider />
            <List sx={{ px: 1, py: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            selected={activeSection === item.id}
                            onClick={() => {
                                onSectionChange(item.id as any);
                                if (isMdDown) setMobileOpen(false);
                            }}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.primary.main + '20',
                                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.main + '30',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: activeSection === item.id ? theme.palette.primary.main : 'inherit' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    fontWeight: activeSection === item.id ? 600 : 400,
                                    color: activeSection === item.id ? theme.palette.primary.main : 'text.primary',
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Box mt="auto" p={2}>
                <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                >
                    กลับหน้าหลัก
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        position: 'relative',
                        height: '100%',
                        backgroundColor: 'transparent',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    {isMdDown && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    {/* Context Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" noWrap component="div" color="text.secondary">
                            {menuItems.find(i => i.id === activeSection)?.label}
                        </Typography>
                    </Box>
                </Box>
                {children}
            </Box>
        </Box>
    );
};

export default ReportsLayout;
