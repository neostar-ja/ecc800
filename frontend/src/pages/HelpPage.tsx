import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import { 
  Help, 
  ExpandMore, 
  ContactSupport, 
  VideoLibrary, 
  Description, 
  PhoneInTalk,
  Email,
  Language,
  Search,
  ChatBubbleOutline,
  LiveHelp,
  School,
  TrendingUp,
  SecurityUpdate,
  Speed,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const HelpPage: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const quickLinks = [
    { 
      icon: <Speed sx={{ fontSize: 40 }} />, 
      title: 'เริ่มต้นอย่างรวดเร็ว', 
      description: 'คู่มือเริ่มต้นใช้งานระบบ',
      color: '#3b82f6'
    },
    { 
      icon: <VideoLibrary sx={{ fontSize: 40 }} />, 
      title: 'วิดีโอสอนใช้งาน', 
      description: 'ชมวิดีโอแนะนำการใช้งาน',
      color: '#ef4444'
    },
    { 
      icon: <School sx={{ fontSize: 40 }} />, 
      title: 'บทเรียนออนไลน์', 
      description: 'เรียนรู้การใช้งานแบบละเอียด',
      color: '#10b981'
    },
    { 
      icon: <ChatBubbleOutline sx={{ fontSize: 40 }} />, 
      title: 'แชทสด', 
      description: 'สนทนากับทีมสนับสนุนแบบสด',
      color: '#8b5cf6'
    },
  ];

  const faqs = [
    {
      question: 'ฉันจะเข้าสู่ระบบได้อย่างไร?',
      answer: 'คุณสามารถเข้าสู่ระบบได้โดยใช้ชื่อผู้ใช้และรหัสผ่านที่ได้รับจากผู้ดูแลระบบ หรือเข้าสู่ระบบผ่าน Keycloak SSO หากมีบัญชี Single Sign-On ของ WUH'
    },
    {
      question: 'ฉันลืมรหัสผ่าน ต้องทำอย่างไร?',
      answer: 'กรุณาติดต่อผู้ดูแลระบบเพื่อขอรีเซ็ตรหัสผ่าน โทร 074-672222 ต่อ 5555 หรือส่งอีเมลไปที่ support@whu.ac.th ระบุชื่อผู้ใช้และข้อมูลยืนยันตัวตน'
    },
    {
      question: 'ฉันจะดูข้อมูลอุปกรณ์ในห้อง Data Center ได้อย่างไร?',
      answer: '1. เข้าสู่ระบบด้วยบัญชีของคุณ\n2. คลิกที่เมนู "แดชบอร์ด" เพื่อดูภาพรวม\n3. คลิกที่เมนู "อุปกรณ์" เพื่อดูรายละเอียดแต่ละอุปกรณ์\n4. คลิกที่เมนู "Data Center 3D" เพื่อดูแบบจำลอง 3 มิติพร้อมข้อมูลเรียลไทม์'
    },
    {
      question: 'ฉันจะดูรายงานข้อผิดพลาดได้จากที่ไหน?',
      answer: 'คลิกที่เมนู "ข้อผิดพลาด" (Faults) บนแถบเมนูด้านซ้าย ระบบจะแสดงรายการข้อผิดพลาดทั้งหมดพร้อมความรุนแรง เวลาที่เกิด และสถานะการแก้ไข คุณสามารถกรองและค้นหาข้อผิดพลาดเฉพาะได้'
    },
    {
      question: 'ฉันจะดาวน์โหลดรายงานได้อย่างไร?',
      answer: '1. ไปที่หน้า "รายงาน" (Reports)\n2. เลือกประเภทรายงานที่ต้องการ (รายวัน, รายสัปดาห์, รายเดือน)\n3. กำหนดช่วงเวลาที่ต้องการดูข้อมูล\n4. คลิกปุ่ม "ดาวน์โหลด" เพื่อบันทึกรายงานเป็นไฟล์ PDF หรือ Excel'
    },
    {
      question: 'ระบบแสดงข้อมูลไม่ถูกต้อง ต้องทำอย่างไร?',
      answer: '1. ลองรีเฟรชหน้าเว็บ (กด Ctrl+F5 หรือ Cmd+Shift+R)\n2. ลบแคชเบราว์เซอร์และลองใหม่\n3. ลองใช้เบราว์เซอร์อื่น (แนะนำ Chrome, Firefox, Edge)\n4. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต\n5. หากยังมีปัญหา กรุณาติดต่อทีมสนับสนุนพร้อมแจ้งรายละเอียดปัญหาและส่ง screenshot'
    },
    {
      question: 'ฉันจะตั้งค่าการแจ้งเตือนได้อย่างไร?',
      answer: 'ไปที่เมนูโปรไฟล์ของคุณ > ตั้งค่า > การแจ้งเตือน คุณสามารถเลือกรับการแจ้งเตือนผ่านอีเมล, SMS หรือในระบบ และกำหนดเงื่อนไขการแจ้งเตือนตามความสำคัญของเหตุการณ์'
    },
    {
      question: 'ระบบรองรับภาษาอะไรบ้าง?',
      answer: 'ปัจจุบันระบบรองรับภาษาไทยและภาษาอังกฤษ คุณสามารถเปลี่ยนภาษาได้จากเมนูโปรไฟล์ > ตั้งค่า > ภาษา'
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <Help sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              ศูนย์ช่วยเหลือ WUH Data Center
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              ยินดีต้อนรับสู่ศูนย์ช่วยเหลือของเรา เราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมง
            </Typography>

            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="ค้นหาคำถาม หรือหัวข้อที่ต้องการความช่วยเหลือ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                mt: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: 3,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickLinks.map((link, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 24px ${alpha(link.color, 0.3)}`,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Avatar
                      sx={{
                        width: 70,
                        height: 70,
                        mx: 'auto',
                        mb: 2,
                        backgroundColor: alpha(link.color, 0.1),
                        color: link.color,
                      }}
                    >
                      {link.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {link.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {link.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LiveHelp sx={{ fontSize: 32, color: '#667eea', mr: 2 }} />
              <Typography variant="h5" fontWeight="bold">
                คำถามที่พบบ่อย (FAQ)
              </Typography>
            </Box>

            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === `panel${index + 1}`}
                onChange={handleChange(`panel${index + 1}`)}
                sx={{
                  mb: 1,
                  '&:before': { display: 'none' },
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    backgroundColor: alpha('#667eea', 0.05),
                    '&:hover': {
                      backgroundColor: alpha('#667eea', 0.1),
                    },
                  }}
                >
                  <Typography fontWeight="bold">{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 2 }}>
                  <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Paper
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
              p: 4,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <ContactSupport sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              ยังต้องการความช่วยเหลือเพิ่มเติม?
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              ทีมสนับสนุนของเราพร้อมให้บริการคุณตลอด 24 ชั่วโมง
            </Typography>

            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2 }}>
                  <PhoneInTalk sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    โทรศัพท์
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    074-672222 ต่อ 5555
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    จันทร์-ศุกร์ 08:00-17:00 น.
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2 }}>
                  <Email sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    อีเมล
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    support@whu.ac.th
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ตอบกลับภายใน 24 ชั่วโมง
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2 }}>
                  <Language sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    เว็บไซต์
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    www.whu.ac.th
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ข้อมูลเพิ่มเติม
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              sx={{
                mt: 4,
                backgroundColor: 'white',
                color: '#667eea',
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.9),
                },
              }}
              startIcon={<ChatBubbleOutline />}
            >
              เริ่มแชทกับทีมสนับสนุน
            </Button>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default HelpPage;
