import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  useTheme, 
  Avatar, 
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Grid,
  AvatarGroup,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { leaveApi } from '../../api/leaveApi';
import useAuthStore from '../../store/useAuthStore';
import { siteConfig } from '../../config/siteConfig';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveCalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isTopAdmin = user?.role === 'TOP_ADMIN';
  const theme = useTheme();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const SERVER_BASE = API_BASE.replace('/api/v1', '');

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getCalendarData();
      if (res.data.success) {
        // Enrich events with colors based on leave type
        const enriched = res.data.data.map(event => ({
          ...event,
          backgroundColor: getLeaveColor(event.extendedProps.leaveType),
          borderColor: 'transparent',
          textColor: '#ffffff'
        }));
        setEvents(enriched);
      }
    } catch (error) {
      console.error("Failed to fetch calendar data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const getLeaveColor = (type) => {
    const map = {
      'Casual': '#6366f1',
      'Medical': '#f59e0b',
      'Vacation': '#22c55e',
      'Duty Leave': '#06b6d4',
      'No Pay Leave': '#f50b0bff',
      'Lieu Leave': '#14becaff',
      'Maternity Leave': '#f50bafff',
      'Sabbatical Leave': '#8b5cf6',
    };
    return map[type] || siteConfig.colors.secondary;
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  return (
    <Box className="animate-in max-w-7xl mx-auto  fade-in duration-700">
      {/* Header Section */}
      <Box className="mb-4 items-center gap-5 md:flex">
        <Typography variant="h4" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
          Approved Leave <span style={{ color: siteConfig.colors.primary }}>Calendar</span>
        </Typography>
        <Typography variant="body1" className="text-slate-500 font-medium max-w-2xl">
          {(isAdmin || isTopAdmin)
            ? 'Unified organizational view of approved absences and scheduled departures.' 
            : `Coordinating availability within the ${user?.department} ecosystem.`}
        </Typography>
      </Box>


      {/* Layout Container */}
      <Box className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Column: Calendar (60%) */}
        <Box className="w-full md:w-[60%] overflow-hidden">
          <Paper 
            className="glass-card p-4 border-none shadow-2xl relative overflow-hidden"
            sx={{ minHeight: '78vh', borderRadius: '24px' }}
          >
            {/* Background Glow Decoration */}
            <Box className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" sx={{ bgcolor: siteConfig.colors.primary }} />

            {loading && (
              <Box className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                <CircularProgress thickness={5} size={60} />
              </Box>
            )}

            <Box sx={{ 
              height: 'calc(82vh - 60px)', // Subtracting space for the header
              '& .fc': {
                '--fc-border-color': `${siteConfig.colors.primary}40`,
                '--fc-today-bg-color': `${siteConfig.colors.primary}25`,
                '--fc-neutral-bg-color': 'transparent',
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                height: '100%'
              },
              '& .fc-theme-standard td, & .fc-theme-standard th': {
                border: `1px solid ${siteConfig.colors.primary}30 !important`,
                background: 'transparent !important'
              },
              '& .fc-col-header': {
                background: 'transparent !important'
              },
              '& .fc-scrollgrid': {
                border: `1px solid ${siteConfig.colors.primary}40 !important`,
                borderRadius: '12px',
                overflow: 'hidden'
              },
              '& .fc-col-header-cell': {
                pb: 1,
                border: 'none !important',
                background: 'transparent !important'
              },
              '& .fc-col-header-cell-cushion': {
                fontWeight: 900,
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                letterSpacing: '0.08rem',
                color: 'var(--text-heading)',
                py: 1
              },
              '& .fc-header-toolbar': {
                mb: 2,
                flexWrap: 'wrap',
                gap: 1
              },
              '& .fc-button-primary': {
                bgcolor: siteConfig.colors.primary,
                color: '#ffffff !important',
                border: 'none',
                borderRadius: '10px !important',
                fontWeight: 900,
                fontSize: '0.65rem',
                padding: '6px 12px',
                textTransform: 'none',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                '&:hover': { bgcolor: siteConfig.colors.secondary, transform: 'translateY(-1px)' }
              },
              '& .fc-toolbar-title': {
                  fontSize: '1.1rem !important',
                  fontWeight: 900
              },
              '& .fc-title': {
                  fontWeight: 800,
                  fontSize: '0.6rem'
              },
              '& .fc-event': {
                borderRadius: '6px',
                padding: '1px 4px',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.02)', zIndex: 10 }
              },
              '& .fc-daygrid-day.fc-day-today': {
                bgcolor: `${siteConfig.colors.primary}20 !important`,
                border: `2px solid ${siteConfig.colors.primary} !important`,
                borderRadius: '12px',
                zIndex: 2,
                '& .fc-daygrid-day-number': {
                  bgcolor: siteConfig.colors.primary,
                  color: '#ffffff !important',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                   display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  m: 1
                }
              },
              '& .fc-daygrid-day-number': {
                fontWeight: 900,
                color: 'var(--text-heading)',
                fontSize: '0.75rem',
                padding: '8px'
              }
            }}>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                firstDay={1}
                events={events}
                eventClick={(info) => handleSelectEvent(info.event)}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek'
                }}
                height="100%"
                stickyHeaderDates={true}
              />
            </Box>
          </Paper>
        </Box>

        {/* Right Column: Upcoming & Meta (40%) */}
        <Box className="w-full md:w-[40%] space-y-6">
          {/* Summary Card */}
          <Paper className="glass-card p-6 border-none rounded-[2rem] overflow-hidden relative">
             <Box className="absolute top-0 right-0 p-4">
                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.7rem' } }}>
                  {events.slice(0, 5).map(e => (
                    <Avatar 
                      key={e.id} 
                      src={e.extendedProps.profilePicture ? `${SERVER_BASE}${e.extendedProps.profilePicture}` : undefined} 
                    />
                  ))}
                </AvatarGroup>
             </Box>
             <Typography variant="h6" className="font-black mb-1">Upcoming Approved Leaves</Typography>
             
             <List className="mt-6 space-y-3 overflow-y-auto pr-2" sx={{ 
                maxHeight: '410px',
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': { width: '2px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '10px' }
             }}>
                <AnimatePresence>
                  {events
                    .filter(e => {
                      const end = new Date(e.extendedProps.actualEnd || e.end);
                      const now = new Date();
                      now.setHours(0,0,0,0);
                      return end >= now;
                    })
                    .sort((a, b) => new Date(a.start) - new Date(b.start))
                    .map((event, idx) => (
                      <ListItem 
                        key={event.id}
                        component={motion.div}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSelectEvent(event)}
                        className="px-4 py-3 rounded-2xl border border-white/40  backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors"
                        sx={{ mb: 1 }}
                      >
                        <Avatar 
                          src={event.extendedProps.profilePicture ? `${SERVER_BASE}${event.extendedProps.profilePicture}` : undefined}
                          sx={{ width: 40, height: 40, bgcolor: event.backgroundColor, mr: 2, fontWeight: 800, fontSize: '0.9rem' }}
                        >
                          {event.title.charAt(0)}
                        </Avatar>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" className="font-bold leading-tight" sx={{ color: 'var(--text-heading)' }}>
                              {event.title.split(' - ')[0]}
                            </Typography>
                          }
                          secondary={
                            <Box >
                              <Box className="flex items-center gap-3  font-bold text-[0.65rem]">
                                {new Date(event.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                <span>→</span>
                                {new Date(event.extendedProps.actualEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                <span className="mx-1 opacity-20">|</span>
                                <span style={{ color: siteConfig.colors.primary }}>{event.extendedProps.totalDays} Days</span>
                              </Box>
                              <Typography variant="caption" className="text-slate-400 font-bold uppercase text-[0.6rem] tracking-wider block mt-0.5">
                                {event.extendedProps.leaveType}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  }
                  {events.length === 0 && !loading && (
                    <Box className="py-12 text-center opacity-40">
                       <Typography variant="body2" className="font-bold">No upcoming absences</Typography>
                    </Box>
                  )}
                </AnimatePresence>
             </List>
          </Paper>

          {/* Leave Type Legend Card */}
          <Paper className="glass-card p-6 border-none rounded-[2rem]">
             <Typography variant="h6" className="font-black mb-4">Leave Types</Typography>
             <Box className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Casual', color: '#6366f1' },
                  { label: 'Medical', color: '#f59e0b' },
                  { label: 'Vacation', color: '#22c55e' },
                  { label: 'Duty', color: '#06b6d4' },
                  { label: 'No Pay', color: '#f50b0bff' },
                  { label: 'Lieu Leave', color: '#14becaff' },
                  { label: 'Maternity Leave', color: '#f50bafff' },
                  { label: 'Special', color: '#d946ef' }
                ].map(type => (
                  <Box key={type.label} className="flex items-center gap-2  rounded-xl ">
                     <Box className="w-2.5 h-2.5 rounded-full" sx={{ bgcolor: type.color }} />
                     <Typography variant="caption" className="font-extrabold uppercase text-[0.6rem] tracking-tighter">{type.label}</Typography>
                  </Box>
                ))}
             </Box>
          </Paper>
        </Box>
      </Box>

      {/* Event Detail Dialog */}
      <AnimatePresence>
        {selectedEvent && (
          <Dialog 
            open={!!selectedEvent} 
            onClose={() => setSelectedEvent(null)}
            maxWidth="xs"
            fullWidth
            slotProps={{
              backdrop: {
                sx: { 
                  backdropFilter: 'blur(8px)', 
                  backgroundColor: 'rgba(0,0,0,0.2)' 
                }
              }
            }}
            PaperProps={{
              sx: { 
                borderRadius: '24px',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }
            }}
          >
            <DialogTitle className="flex justify-between items-center p-6 pb-2">
              <Typography variant="h6" className="font-black" sx={{ color: 'var(--text-heading)' }}>Absence Details</Typography>
              <IconButton onClick={() => setSelectedEvent(null)} size="small" sx={{ color: 'var(--text-heading)', bgcolor: 'rgba(0,0,0,0.05)' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent className="p-6">
              <Box className="flex items-center gap-4 mb-6">
                <Avatar 
                  src={selectedEvent.extendedProps.profilePicture ? `${SERVER_BASE}${selectedEvent.extendedProps.profilePicture}` : undefined}
                  sx={{ width: 56, height: 56, bgcolor: selectedEvent.backgroundColor, fontWeight: 800 }}
                >
                    {selectedEvent.title.charAt(0)}
                </Avatar>
                <Box>
                    <Typography variant="h6" className="font-bold leading-tight" sx={{ color: 'var(--text-heading)' }}>
                        {selectedEvent.title.split(' - ')[0]}
                    </Typography>
                    <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-widest block mt-1">
                        {selectedEvent.extendedProps.department} Dept
                    </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3, borderColor: 'var(--glass-border)' }} />

              <Box className="space-y-4">
                  <Box className="flex justify-between items-center">
                    <Typography variant="body2" className="text-slate-500 font-bold">Leave Type</Typography>
                    <Chip 
                        label={selectedEvent.extendedProps.leaveType} 
                        size="small" 
                        sx={{ 
                            bgcolor: `${selectedEvent.backgroundColor}20`, 
                            color: selectedEvent.backgroundColor,
                            fontWeight: 800,
                            borderRadius: '8px'
                        }} 
                    />
                  </Box>
                  <Box className="flex justify-between items-center">
                    <Typography variant="body2" className="text-slate-500 font-bold">Duration</Typography>
                    <Typography variant="body2" className="font-black" sx={{ color: 'var(--text-heading)' }}>
                        {new Date(selectedEvent.start).toLocaleDateString()} - {new Date(selectedEvent.extendedProps.actualEnd).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between items-center">
                    <Typography variant="body2" className="text-slate-500 font-bold">Category</Typography>
                    <Typography variant="body2" className="font-black" sx={{ color: 'var(--text-heading)' }}>{selectedEvent.extendedProps.category}</Typography>
                  </Box>
              </Box>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default LeaveCalendarPage;
