/**
 * Keycloak SSO Management Component
 * จัดการการตั้งค่า Keycloak SSO
 */
import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Divider
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import KeycloakConfigPanel from './KeycloakConfigPanel';

const KeycloakSSOManagement: React.FC = () => {
  return (
    <Card>
      <CardHeader
        avatar={<SecurityIcon color="primary" />}
        title="Keycloak SSO"
        subheader="จัดการการตั้งค่า Single Sign-On และผู้ใช้ที่อนุญาต"
      />
      <Divider />
      <CardContent>
        <KeycloakConfigPanel />
      </CardContent>
    </Card>
  );
};

export default KeycloakSSOManagement;
