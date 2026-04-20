import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  alpha,
} from '@mui/material';
import { 
  Security, 
  CheckCircle, 
  Lock,
  VerifiedUser,
  Policy,
  DataUsage,
  Share,
  Update,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const PrivacyPage: React.FC = () => {
  const privacyCards = [
    {
      icon: <DataUsage />,
      title: 'ข้อมูลที่เก็บรวบรวม',
      items: [
        'ข้อมูลการเข้าสู่ระบบ (ชื่อผู้ใช้, รหัสผ่าน)',
        'ข้อมูลการใช้งานระบบ (เวลาเข้าสู่ระบบ, กิจกรรมที่ทำ)',
        'ข้อมูล IP Address และข้อมูลอุปกรณ์ที่ใช้เข้าถึงระบบ',
        'ข้อมูลการตั้งค่าและการใช้งานฟีเจอร์ต่างๆ ในระบบ',
      ],
      color: '#3b82f6',
    },
    {
      icon: <Policy />,
      title: 'วัตถุประสงค์ในการใช้ข้อมูล',
      items: [
        'ให้บริการและดูแลรักษาระบบให้ทำงานได้อย่างมีประสิทธิภาพ',
        'ปรับปรุงและพัฒนาระบบให้ดีขึ้นอย่างต่อเนื่อง',
        'ตรวจสอบและแก้ไขปัญหาทางเทคนิคอย่างรวดเร็ว',
        'รักษาความปลอดภัยและป้องกันการใช้งานที่ไม่เหมาะสม',
      ],
      color: '#10b981',
    },
    {
      icon: <Share />,
      title: 'การเปิดเผยข้อมูล',
      items: [
        'เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านต่อบุคคลภายนอก',
        'ยกเว้นเมื่อได้รับความยินยอมจากท่านอย่างชัดเจน',
        'เพื่อปฏิบัติตามกฎหมายหรือคำสั่งศาลที่มีผลบังคับใช้',
        'เพื่อปกป้องสิทธิและความปลอดภัยของเราและผู้อื่น',
      ],
      color: '#f59e0b',
    },
    {
      icon: <Lock />,
      title: 'การรักษาความปลอดภัยของข้อมูล',
      items: [
        'การเข้ารหัสข้อมูลด้วยมาตรฐานสากล (SSL/TLS)',
        'การควบคุมการเข้าถึงข้อมูลอย่างเข้มงวด',
        'การตรวจสอบระบบและความปลอดภัยอย่างสม่ำเสมอ',
        'การสำรองข้อมูลและแผนกู้คืนภัยพิบัติ',
      ],
      color: '#ef4444',
    },
    {
      icon: <VerifiedUser />,
      title: 'สิทธิของท่าน',
      items: [
        'สิทธิในการเข้าถึงและขอสำเนาข้อมูลส่วนบุคคล',
        'สิทธิในการแก้ไขข้อมูลส่วนบุคคลที่ไม่ถูกต้อง',
        'สิทธิในการลบข้อมูลส่วนบุคคล (Right to be Forgotten)',
        'สิทธิในการคัดค้านการประมวลผลข้อมูล',
      ],
      color: '#8b5cf6',
    },
    {
      icon: <Update />,
      title: 'การเปลี่ยนแปลงนโยบาย',
      items: [
        'เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว',
        'การเปลี่ยนแปลงที่สำคัญจะมีการแจ้งให้ท่านทราบผ่านระบบ',
        'กรุณาตรวจสอบนโยบายนี้เป็นประจำ',
        'การใช้งานระบบต่อถือว่ายอมรับนโยบายที่เปลี่ยนแปลง',
      ],
      color: '#06b6d4',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              }}
            >
              <Security sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              นโยบายความเป็นส่วนตัว
            </Typography>
            <Typography variant="h6" color="text.secondary">
              เราให้ความสำคัญกับความเป็นส่วนตัวและการคุ้มครองข้อมูลของคุณ
            </Typography>
            <Chip
              label="มีผลบังคับใช้: 2 ตุลาคม 2568"
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
              โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์ ให้ความสำคัญกับความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของท่าน
              นโยบายความเป็นส่วนตัวนี้อธิบายวิธีการที่เราเก็บรวบรวม ใช้ และคุ้มครองข้อมูลของท่านอย่างละเอียด
              ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            </Typography>
          </Paper>
        </motion.div>

        <Grid container spacing={3}>
          {privacyCards.map((card, index) => (
            <Grid item xs={12} md={6} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 24px ${alpha(card.color, 0.3)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          backgroundColor: alpha(card.color, 0.1),
                          color: card.color,
                          mr: 2,
                          width: 56,
                          height: 56,
                        }}
                      >
                        {card.icon}
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold">
                        {card.title}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {card.items.map((item, i) => (
                        <Box
                          component="li"
                          key={i}
                          sx={{
                            mb: 1.5,
                            display: 'flex',
                            alignItems: 'flex-start',
                            listStyle: 'none',
                          }}
                        >
                          <CheckCircle
                            sx={{
                              fontSize: 20,
                              color: card.color,
                              mr: 1,
                              mt: 0.3,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Paper
            elevation={0}
            sx={{
              mt: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
              p: 4,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              ติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)
            </Typography>
            <Typography variant="body1" paragraph>
              หากท่านมีคำถามหรือต้องการใช้สิทธิของท่านเกี่ยวกับข้อมูลส่วนบุคคล
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" fontWeight="bold">
                อีเมล: privacy@whu.ac.th
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                โทรศัพท์: 074-672222 ต่อ 5555
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                ที่อยู่: โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                222 ตำบลไทยบุรี อำเภอท่าศาลา จังหวัดนครศรีธรรมราช 80161
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PrivacyPage;
