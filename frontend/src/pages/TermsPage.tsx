import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from '@mui/material';
import { Article, CheckCircle, Update, Gavel, Security, AccountBalance } from '@mui/icons-material';
import { motion } from 'framer-motion';

const TermsPage: React.FC = () => {
  const sections = [
    {
      icon: <CheckCircle />,
      title: '1. การยอมรับข้อกำหนด',
      content: 'การเข้าใช้งานระบบ WUH Data Center Monitor ถือว่าท่านได้อ่านและยอมรับข้อกำหนดและเงื่อนไขการใช้งานนี้แล้ว หากท่านไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดการใช้งานระบบทันที',
      color: '#3b82f6',
    },
    {
      icon: <Gavel />,
      title: '2. ขอบเขตการใช้งาน',
      content: 'ระบบนี้พัฒนาขึ้นเพื่อติดตามและแสดงผลข้อมูลศูนย์ข้อมูล (Data Center) ของโรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์ โดยมีวัตถุประสงค์เพื่อการบริหารจัดการและตรวจสอบสถานะอุปกรณ์ต่างๆ อย่างมีประสิทธิภาพ',
      color: '#10b981',
    },
    {
      icon: <Security />,
      title: '3. การรักษาความปลอดภัย',
      content: 'ผู้ใช้งานมีหน้าที่รับผิดชอบในการรักษาความลับของข้อมูลบัญชีผู้ใช้ รหัสผ่าน และข้อมูลสำคัญอื่นๆ ไม่เปิดเผยหรือแบ่งปันข้อมูลเข้าสู่ระบบกับบุคคลอื่น ผู้ใช้งานต้องแจ้งผู้ดูแลระบบทันทีหากพบการใช้งานที่ผิดปกติ',
      color: '#f59e0b',
    },
    {
      icon: <AccountBalance />,
      title: '4. ข้อจำกัดความรับผิดชอบ',
      content: 'ระบบนี้จัดทำขึ้นเพื่อใช้งานภายในองค์กรเท่านั้น ผู้พัฒนาและผู้ดูแลระบบไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการใช้งานระบบนี้ ไม่ว่าจะเป็นความเสียหายทางตรงหรือทางอ้อม รวมถึงการสูญเสียข้อมูล',
      color: '#ef4444',
    },
    {
      icon: <Update />,
      title: '5. การแก้ไขข้อกำหนด',
      content: 'ผู้ดูแลระบบสามารถแก้ไขข้อกำหนดและเงื่อนไขการใช้งานนี้ได้ตลอดเวลา โดยจะแจ้งให้ผู้ใช้งานทราบล่วงหน้าผ่านระบบ การใช้งานระบบต่อไปหลังจากมีการแก้ไขถือว่าท่านยอมรับข้อกำหนดที่แก้ไขแล้ว',
      color: '#8b5cf6',
    },
    {
      icon: <Gavel />,
      title: '6. กฎหมายที่ใช้บังคับ',
      content: 'ข้อกำหนดและเงื่อนไขนี้อยู่ภายใต้กฎหมายของประเทศไทย และข้อพิพาทใดๆ จะอยู่ในเขตอำนาจของศาลในประเทศไทย โดยเฉพาะศาลในจังหวัดนครศรีธรรมราช',
      color: '#06b6d4',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              p: 4,
              mb: 4,
              textAlign: 'center',
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              }}
            >
              <Article sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              ข้อกำหนดและเงื่อนไขการใช้งาน
            </Typography>
            <Typography variant="h6" color="text.secondary">
              WUH Data Center Monitor System
            </Typography>
            <Chip
              label="อัปเดตล่าสุด: 2 ตุลาคม 2568"
              sx={{ mt: 2 }}
              color="primary"
            />
          </Paper>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              p: 4,
              mb: 4,
            }}
          >
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              ยินดีต้อนรับสู่ระบบ WUH Data Center Monitor กรุณาอ่านข้อกำหนดและเงื่อนไขการใช้งานอย่างละเอียดก่อนเข้าใช้งานระบบ
              การใช้งานระบบนี้แสดงว่าท่านได้ยอมรับและตกลงปฏิบัติตามข้อกำหนดทั้งหมด
            </Typography>

            <Divider sx={{ my: 3 }} />

            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <Box
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: alpha(section.color, 0.05),
                    borderLeft: `4px solid ${section.color}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      backgroundColor: alpha(section.color, 0.1),
                      transform: 'translateX(8px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: section.color,
                        mr: 2,
                        width: 48,
                        height: 48,
                      }}
                    >
                      {section.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      {section.title}
                    </Typography>
                  </Box>
                  <Typography sx={{ lineHeight: 1.8, pl: 8 }}>
                    {section.content}
                  </Typography>
                </Box>
              </motion.div>
            ))}

            <Divider sx={{ my: 4 }} />

            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                การติดต่อและสอบถาม
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="อีเมล: legal@whu.ac.th"
                    secondary="สำหรับคำถามเกี่ยวกับข้อกำหนดและเงื่อนไข"
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="โทรศัพท์: 074-672222 ต่อ 5555"
                    secondary="สำหรับคำแนะนำและความช่วยเหลือ"
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="ที่อยู่: โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์"
                    secondary="222 ตำบลไทยบุรี อำเภอท่าศาลา จังหวัดนครศรีธรรมราช 80161"
                    secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                  />
                </ListItem>
              </List>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default TermsPage;
