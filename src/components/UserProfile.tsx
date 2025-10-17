import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Settings, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function UserProfile() {
  const { user, profile, refreshUser, hasRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    department: '',
    profile_image: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        department: profile.department || '',
        profile_image: profile.profile_image || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    try {
      const { error } = await window.ezsite.apis.tableUpdate(34154, {
        ID: profile.id,
        ...formData,
      });

      if (error) throw new Error(error);

      setIsEditing(false);
      await refreshUser();
      toast({ title: 'Profile updated', description: 'Your profile has been successfully updated.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile. Please try again.' });
    }
  };

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'trader': return 'bg-blue-100 text-blue-800';
      case 'analyst': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.profile_image} alt={user.Name} />
              <AvatarFallback className="text-lg">
                {(profile.first_name?.[0] || user.Name[0] || 'U').toUpperCase()}
                {(profile.last_name?.[0] || '').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      placeholder="Enter first name"
                    />
                  ) : (
                    <div className="font-medium">{profile.first_name || 'Not set'}</div>
                  )}
                </div>
                
                <div>
                  <Label>Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      placeholder="Enter last name"
                    />
                  ) : (
                    <div className="font-medium">{profile.last_name || 'Not set'}</div>
                  )}
                </div>
                
                <div>
                  <Label>Email</Label>
                  <div className="font-medium text-gray-700">{user.Email}</div>
                </div>
                
                <div>
                  <Label>Department</Label>
                  {isEditing ? (
                    <Input
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="Enter department"
                    />
                  ) : (
                    <div className="font-medium">{profile.department || 'Not set'}</div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Role</Label>
              <Badge className={`mt-1 ${getRoleColor(profile.role)}`}>
                {profile.role.toUpperCase()}
              </Badge>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">API Access</Label>
              <Badge className={`mt-1 ${getAccessLevelColor(profile.api_access_level)}`}>
                {profile.api_access_level.toUpperCase()}
              </Badge>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <Badge className={`mt-1 ${profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {profile.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Account Details</Label>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Member since: {new Date(user.CreateTime).toLocaleDateString()}</span>
              </div>
              {profile.last_login && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Last login: {new Date(profile.last_login).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-2 block">Permissions</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(profile.permissions).map(([permission, enabled]) => (
                <Badge 
                  key={permission}
                  variant={enabled ? "default" : "secondary"}
                  className="text-xs"
                >
                  {permission.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}