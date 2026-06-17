import { describe, it, expect } from 'vitest';
import {
  CreateGallerySchema,
  UpdateGallerySchema,
  GallerySettingsSchema,
  CreateUploadUrlsSchema,
  CreateInvitationSchema,
  AcceptInvitationSchema,
  ToggleFavoriteSchema,
  SetRatingSchema,
  CreateCommentSchema,
  SubmitSelectionSchema,
  RequestExportSchema,
  UpdateProfileSchema,
  PhotoMetadataSchema,
} from '../src/schemas/index';

describe('CreateGallerySchema', () => {
  it('validates a valid gallery input', () => {
    const result = CreateGallerySchema.parse({
      title: 'Miller Wedding',
    });
    expect(result.title).toBe('Miller Wedding');
  });

  it('rejects empty title', () => {
    expect(() => CreateGallerySchema.parse({ title: '' })).toThrow();
  });

  it('rejects title over 200 chars', () => {
    expect(() => CreateGallerySchema.parse({ title: 'a'.repeat(201) })).toThrow();
  });

  it('accepts optional settings', () => {
    const result = CreateGallerySchema.parse({
      title: 'Test Gallery',
      settings: {
        privacy: 'invite_only',
        allowDownloads: false,
        watermarked: true,
        proofingEnabled: true,
      },
    });
    expect(result.settings?.privacy).toBe('invite_only');
    expect(result.settings?.watermarked).toBe(true);
  });
});

describe('GallerySettingsSchema', () => {
  it('applies defaults', () => {
    const result = GallerySettingsSchema.parse({});
    expect(result.privacy).toBe('invite_only');
    expect(result.allowDownloads).toBe(true);
    expect(result.watermarked).toBe(false);
    expect(result.proofingEnabled).toBe(true);
  });

  it('rejects invalid privacy value', () => {
    expect(() => GallerySettingsSchema.parse({ privacy: 'secret' })).toThrow();
  });
});

describe('UpdateGallerySchema', () => {
  it('validates a valid update', () => {
    const result = UpdateGallerySchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Updated Title',
      status: 'published',
    });
    expect(result.title).toBe('Updated Title');
    expect(result.status).toBe('published');
  });

  it('rejects invalid UUID', () => {
    expect(() => UpdateGallerySchema.parse({ id: 'not-a-uuid' })).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() =>
      UpdateGallerySchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'deleted',
      })
    ).toThrow();
  });
});

describe('CreateUploadUrlsSchema', () => {
  it('validates valid upload request', () => {
    const result = CreateUploadUrlsSchema.parse({
      gallery_id: '123e4567-e89b-12d3-a456-426614174000',
      files: [
        { filename: 'photo.jpg', content_type: 'image/jpeg', size: 1024 },
      ],
    });
    expect(result.files).toHaveLength(1);
  });

  it('rejects empty files array', () => {
    expect(() =>
      CreateUploadUrlsSchema.parse({
        gallery_id: '123e4567-e89b-12d3-a456-426614174000',
        files: [],
      })
    ).toThrow();
  });

  it('rejects more than 50 files', () => {
    const files = Array.from({ length: 51 }, (_, i) => ({
      filename: `photo${i}.jpg`,
      content_type: 'image/jpeg',
      size: 1024,
    }));
    expect(() =>
      CreateUploadUrlsSchema.parse({
        gallery_id: '123e4567-e89b-12d3-a456-426614174000',
        files,
      })
    ).toThrow();
  });
});

describe('CreateInvitationSchema', () => {
  it('validates valid invitation', () => {
    const result = CreateInvitationSchema.parse({
      gallery_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'client@example.com',
    });
    expect(result.email).toBe('client@example.com');
  });

  it('rejects invalid email', () => {
    expect(() =>
      CreateInvitationSchema.parse({
        gallery_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'not-an-email',
      })
    ).toThrow();
  });
});

describe('AcceptInvitationSchema', () => {
  it('validates token', () => {
    const result = AcceptInvitationSchema.parse({ token: 'abc123' });
    expect(result.token).toBe('abc123');
  });

  it('rejects empty token', () => {
    expect(() => AcceptInvitationSchema.parse({ token: '' })).toThrow();
  });
});

describe('Proofing Schemas', () => {
  it('validates toggle favorite', () => {
    const result = ToggleFavoriteSchema.parse({
      gallery_id: '123e4567-e89b-12d3-a456-426614174000',
      photo_id: '123e4567-e89b-12d3-a456-426614174001',
    });
    expect(result.gallery_id).toBeDefined();
  });

  it('validates rating in range', () => {
    const result = SetRatingSchema.parse({
      gallery_id: '123e4567-e89b-12d3-a456-426614174000',
      photo_id: '123e4567-e89b-12d3-a456-426614174001',
      rating: 5,
    });
    expect(result.rating).toBe(5);
  });

  it('rejects rating out of range', () => {
    expect(() =>
      SetRatingSchema.parse({
        gallery_id: '123e4567-e89b-12d3-a456-426614174000',
        photo_id: '123e4567-e89b-12d3-a456-426614174001',
        rating: 6,
      })
    ).toThrow();
  });

  it('validates comment', () => {
    const result = CreateCommentSchema.parse({
      gallery_id: '123e4567-e89b-12d3-a456-426614174000',
      photo_id: '123e4567-e89b-12d3-a456-426614174001',
      body: 'Love this shot!',
    });
    expect(result.body).toBe('Love this shot!');
  });

  it('rejects empty comment', () => {
    expect(() =>
      CreateCommentSchema.parse({
        gallery_id: '123e4567-e89b-12d3-a456-426614174000',
        photo_id: '123e4567-e89b-12d3-a456-426614174001',
        body: '',
      })
    ).toThrow();
  });

  it('validates submit selection', () => {
    const result = SubmitSelectionSchema.parse({
      gallery_id: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.gallery_id).toBeDefined();
  });

  it('validates export request', () => {
    const result = RequestExportSchema.parse({
      gallery_id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'zip_selected',
    });
    expect(result.type).toBe('zip_selected');
  });
});

describe('PhotoMetadataSchema', () => {
  it('validates valid metadata', () => {
    const result = PhotoMetadataSchema.parse({
      width: 1920,
      height: 1080,
    });
    expect(result.width).toBe(1920);
  });

  it('accepts optional fields', () => {
    const result = PhotoMetadataSchema.parse({
      width: 1920,
      height: 1080,
      camera_make: 'Canon',
      camera_model: 'EOS R5',
    });
    expect(result.camera_make).toBe('Canon');
  });
});

describe('UpdateProfileSchema', () => {
  it('validates studio name', () => {
    const result = UpdateProfileSchema.parse({
      studio_name: 'My Studio',
    });
    expect(result.studio_name).toBe('My Studio');
  });

  it('validates watermark settings', () => {
    const result = UpdateProfileSchema.parse({
      watermark_settings: {
        enabled: true,
        text: 'My Studio',
        opacity: 0.5,
        position: 'center',
      },
    });
    expect(result.watermark_settings?.enabled).toBe(true);
  });
});
