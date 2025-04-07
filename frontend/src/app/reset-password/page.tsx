import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function Page() {
    return (
        <Suspense fallback={<p className="text-center mt-10">กำลังโหลด...</p>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
