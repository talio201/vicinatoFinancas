import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiUser, FiEdit, FiSave, FiX, FiKey, FiUsers, FiSend, FiCheck, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import { supabase } from '../../services/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';


interface Profile {
  full_name: string;
  avatar_url?: string;
}

interface CoupleRelationship {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  user1_profile?: { full_name: string; } | null;
  user2_profile?: { full_name: string; } | null;
}


const profileSchema = Yup.object().shape({
  full_name: Yup.string().required('Nome completo é obrigatório'),
});

const passwordSchema = Yup.object().shape({
  new_password: Yup.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .required('Nova senha é obrigatória'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('new_password')], 'As senhas não coincidem')
    .required('Confirmação de senha é obrigatória'),
});

const matchRequestSchema = Yup.object().shape({
  partner_email: Yup.string()
    .email('Email inválido')
    .required('Email do parceiro é obrigatório'),
});


const SectionCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
  <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
    <div className="flex items-center mb-4">
      {icon}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white ml-2">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input id={id} {...props} className="input w-full py-2 px-3 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 disabled:dark:bg-gray-600" />
  </div>
);


export const ProfilePage = () => {
  const { user, session, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  
  const { data: profile, isLoading, error } = useQuery<Profile>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Não foi possível buscar o perfil.');
      return response.json();
    },
    enabled: !!session && !!user?.id,
  });

  const { data: relationships = [] } = useQuery<CoupleRelationship[]>({
    queryKey: ['coupleRelationships', user?.id],
    queryFn: async () => {
      if (!session) return [];
      const response = await fetch(`${API_BASE_URL}/api/couple-relationships`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Não foi possível buscar os relacionamentos.');
      return response.json();
    },
    enabled: !!session && !!user?.id,
  });

  const acceptedRelationship = relationships.find(rel => rel.status === 'accepted');
  const pendingSentRequest = relationships.find(rel => rel.status === 'pending' && rel.user1_id === user?.id);
  const pendingReceivedRequests = relationships.filter(rel => rel.status === 'pending' && rel.user2_id === user?.id);

  
  const sendMatchRequestMutation = useMutation({
    mutationFn: async (data: { partner_email: string }) => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/couple-relationships/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ partner_email: data.partner_email }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível enviar o pedido.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Pedido de conexão enviado!');
      queryClient.invalidateQueries({ queryKey: ['coupleRelationships'] });
      matchRequestFormik.resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const acceptMatchRequestMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/couple-relationships/${relationshipId}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível aceitar o pedido.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Pedido de conexão aceito!');
      queryClient.invalidateQueries({ queryKey: ['coupleRelationships'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMatchRequestMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/couple-relationships/${relationshipId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível rejeitar o pedido.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Pedido de conexão rejeitado.');
      queryClient.invalidateQueries({ queryKey: ['coupleRelationships'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      if (!session) throw new Error('Autenticação necessária.');
      await fetch(`${API_BASE_URL}/api/couple-relationships/${relationshipId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    },
    onSuccess: () => {
      toast.success('Relacionamento removido.');
      queryClient.invalidateQueries({ queryKey: ['coupleRelationships'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: Profile) => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(updatedProfile),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível atualizar o perfil.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Perfil atualizado!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { new_password: string }) => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ new_password: data.new_password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível redefinir a senha.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!');
      passwordFormik.resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  
  const profileFormik = useFormik({ initialValues: { full_name: '' }, validationSchema: profileSchema, onSubmit: (values) => updateProfileMutation.mutate(values) });
  const passwordFormik = useFormik({ initialValues: { new_password: '', confirm_password: '' }, validationSchema: passwordSchema, onSubmit: (values) => resetPasswordMutation.mutate(values) });
  const matchRequestFormik = useFormik({ initialValues: { partner_email: '' }, validationSchema: matchRequestSchema, onSubmit: (values) => sendMatchRequestMutation.mutate(values) });

  useEffect(() => {
    if (profile) {
      profileFormik.setValues({ full_name: profile.full_name || '' });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile, profileFormik]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    const filePath = `${user.id}/${Math.random()}.${file.name.split('.').pop()}`;
    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      updateProfileMutation.mutate({ ...profileFormik.values, avatar_url: publicUrl });
      toast.success('Avatar atualizado!');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Erro no upload: ${message}`);
    }
  };

  if (authLoading || isLoading) return <Layout><div className="text-center py-8">Carregando...</div></Layout>;
  if (error) return <Layout><div className="text-center py-8 text-red-500">Erro: {error.message}</div></Layout>;

  const PartnerInfo = () => {
    if (acceptedRelationship) {
      const partner = acceptedRelationship.user1_id === user?.id ? acceptedRelationship.user2_profile : acceptedRelationship.user1_profile;
      return (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md flex items-center justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">Conectado(a) com: <span className="font-semibold">{partner?.full_name || 'Usuário'}</span></p>
          <button onClick={() => deleteRelationshipMutation.mutate(acceptedRelationship.id)} disabled={deleteRelationshipMutation.isPending} className="btn-danger flex items-center px-4 py-2 rounded-lg transition-transform hover:scale-105 bg-red-600 hover:bg-red-700 text-white">
            <FiTrash2 className="mr-2"/> {deleteRelationshipMutation.isPending ? '...' : 'Desconectar'}
          </button>
        </div>
      );
    }
    if (pendingSentRequest) {
      return <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md"><p className="text-sm text-gray-700 dark:text-gray-300">Pedido de conexão pendente enviado.</p></div>;
    }
    return (
      <form onSubmit={matchRequestFormik.handleSubmit} className="space-y-4">
        <InputField id="partner_email" label="Email do Parceiro" type="email" {...matchRequestFormik.getFieldProps('partner_email')} />
        {matchRequestFormik.touched.partner_email && matchRequestFormik.errors.partner_email && <p className="text-red-500 text-xs mt-1">{matchRequestFormik.errors.partner_email}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={sendMatchRequestMutation.isPending} className="btn-primary flex items-center px-4 py-2 rounded-lg transition-transform hover:scale-105 bg-green-600 hover:bg-green-700 text-white">
            <FiSend className="mr-2"/> {sendMatchRequestMutation.isPending ? 'Enviando...' : 'Enviar Pedido'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">Meu Perfil</h1>
        </motion.div>

        <SectionCard title="Informações Pessoais" icon={<FiUser className="text-blue-500"/>}>
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              {avatarUrl ? <img key={avatarUrl} src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <FiUser className="w-16 h-16 text-gray-500" />}
              <label htmlFor="avatar_upload" className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-transform transform hover:scale-110 z-50 transform translate-x-1/4 translate-y-1/4">
                <FiEdit size={18} />
                <input type="file" id="avatar_upload" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>
          <form onSubmit={profileFormik.handleSubmit} className="space-y-4">
            <InputField id="full_name" label="Nome Completo" type="text" {...profileFormik.getFieldProps('full_name')} disabled={!isEditing} />
            {profileFormik.touched.full_name && profileFormik.errors.full_name && <p className="text-red-500 text-xs mt-1">{profileFormik.errors.full_name}</p>}
            <InputField id="email" label="Email" type="email" value={user?.email || ''} disabled />
            <div className="flex justify-end space-x-4 mt-6">
              {isEditing ? (
                <>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary flex items-center px-4 py-2 rounded-lg transition-transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-gray-800"><FiX className="mr-2"/>Cancelar</button>
                  <button type="submit" disabled={updateProfileMutation.isPending} className="btn-primary flex items-center px-4 py-2 rounded-lg transition-transform hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white"><FiSave className="mr-2"/>{updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}</button>
                </>
              ) : (
                <button type="button" onClick={() => setIsEditing(true)} className="btn-secondary flex items-center px-4 py-2 rounded-lg transition-transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-gray-800"><FiEdit className="mr-2"/>Editar Perfil</button>
              )}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Segurança" icon={<FiKey className="text-purple-500"/>}>
          <form onSubmit={passwordFormik.handleSubmit} className="space-y-4">
            <InputField id="new_password" label="Nova Senha" type="password" {...passwordFormik.getFieldProps('new_password')} />
            {passwordFormik.touched.new_password && passwordFormik.errors.new_password && <p className="text-red-500 text-xs mt-1">{passwordFormik.errors.new_password}</p>}
            <InputField id="confirm_password" label="Confirmar Nova Senha" type="password" {...passwordFormik.getFieldProps('confirm_password')} />
            {passwordFormik.touched.confirm_password && passwordFormik.errors.confirm_password && <p className="text-red-500 text-xs mt-1">{passwordFormik.errors.confirm_password}</p>}
            <div className="flex justify-end"><button type="submit" disabled={resetPasswordMutation.isPending} className="btn-primary px-4 py-2 rounded-lg transition-transform hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white">{resetPasswordMutation.isPending ? 'Redefinindo...' : 'Redefinir Senha'}</button></div>
          </form>
        </SectionCard>

        <SectionCard title="Gerenciar Parceiro" icon={<FiUsers className="text-green-500"/>}>
          <PartnerInfo />
          {pendingReceivedRequests.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold mb-2">Pedidos Recebidos</h3>
              <ul className="space-y-2">
                {pendingReceivedRequests.map(request => (
                  <li key={request.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md flex items-center justify-between">
                    <p>De: <span className="font-semibold">{request.user1_profile?.full_name || 'Usuário'}</span></p>
                    <div className="space-x-2">
                      <button onClick={() => acceptMatchRequestMutation.mutate(request.id)} disabled={acceptMatchRequestMutation.isPending} className="btn-success flex items-center px-4 py-2 rounded-lg transition-transform hover:scale-105 bg-green-600 hover:bg-green-700 text-white"><FiCheck className="mr-1"/>Aceitar</button>
                      <button onClick={() => rejectMatchRequestMutation.mutate(request.id)} disabled={rejectMatchRequestMutation.isPending} className="btn-danger flex items-center px-4 py-2 rounded-lg transition-transform hover:scale-105 bg-red-600 hover:bg-red-700 text-white"><FiX className="mr-1"/>Rejeitar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

      </div>
    </Layout>
  );
};