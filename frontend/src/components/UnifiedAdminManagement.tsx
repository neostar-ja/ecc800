/**
 * Unified Admin Management Component
 * รวมหน้าจัดการ Users & Roles, Menu Permissions, Keycloak ในหน้าเดียว
 * - Tab 1: จัดการผู้ใช้และบทบาท (รวม Users + Roles)
 * - Tab 2: สิทธิ์เมนู (View-Only พร้อมเพิ่มเมนูได้)
 * - Tab 3: Keycloak SSO
 */
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import {
  People as PeopleIcon,
  Menu as MenuIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import UserRoleManagement from './UserRoleManagement';
import MenuPermissionManagementNew from './MenuPermissionManagementNew';
import KeycloakSSOManagement from './KeycloakSSOManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const UnifiedAdminManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs 
            value={selectedTab} 
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<PeopleIcon />} 
              iconPosition="start"
              label="จัดการผู้ใช้และบทบาท" 
            />
            <Tab 
              icon={<MenuIcon />} 
              iconPosition="start"
              label="สิทธิ์เมนู" 
            />
            <Tab 
              icon={<KeyIcon />} 
              iconPosition="start"
              label="Keycloak SSO" 
            />
          </Tabs>
        </Box>
        
        <CardContent>
          <TabPanel value={selectedTab} index={0}>
            <UserRoleManagement />
          </TabPanel>
          
          <TabPanel value={selectedTab} index={1}>
            <MenuPermissionManagementNew />
          </TabPanel>
          
          <TabPanel value={selectedTab} index={2}>
            <KeycloakSSOManagement />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UnifiedAdminManagement;
